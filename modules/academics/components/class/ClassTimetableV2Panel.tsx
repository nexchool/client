import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/common/constants/colors";
import { Spacing, Layout } from "@/common/constants/spacing";
import { classAcademicApi } from "../../api/classAcademicApi";
import { ApiException } from "@/common/services/api";
import { qk } from "../../hooks/queryKeys";
import type {
  BellSchedulePeriod,
  ClassSubjectOffering,
  SubjectTeacherAssignment,
  TimetableEntryV2,
  TimetableVersion,
} from "../../types";
import { StatusChip } from "../StatusChip";

type Props = { classId: string; canManage: boolean };

function fmtTime(iso?: string | null) {
  if (!iso) return "";
  const t = iso.includes("T") ? iso.split("T")[1]?.slice(0, 5) : iso.slice(0, 5);
  return t ?? "";
}

function derivePeriodsFromEntries(
  entries: TimetableEntryV2[],
  periodLabel: (n: number) => string
): BellSchedulePeriod[] {
  const nums = [...new Set(entries.map((e) => e.period_number))].sort((a, b) => a - b);
  return nums.map((n) => ({
    id: `derived-${n}`,
    bell_schedule_id: "",
    period_number: n,
    period_kind: "lesson",
    starts_at: null,
    ends_at: null,
    label: periodLabel(n),
    sort_order: n,
  }));
}

export function ClassTimetableV2Panel({ classId, canManage }: Props) {
  const { t } = useTranslation("timetable");
  const qc = useQueryClient();
  const [versions, setVersions] = useState<TimetableVersion[]>([]);
  const [selVer, setSelVer] = useState<string | null>(null);
  const [bundleVer, setBundleVer] = useState<TimetableVersion | null>(null);
  const [entries, setEntries] = useState<TimetableEntryV2[]>([]);
  const [bellScheduleName, setBellScheduleName] = useState<string | null>(null);
  const [lessonPeriods, setLessonPeriods] = useState<BellSchedulePeriod[]>([]);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [bundleEditable, setBundleEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offerings, setOfferings] = useState<ClassSubjectOffering[]>([]);
  const [subjTeachers, setSubjTeachers] = useState<SubjectTeacherAssignment[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<TimetableEntryV2 | null>(null);
  const [day, setDay] = useState(1);
  const [period, setPeriod] = useState(1);
  const [csId, setCsId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [room, setRoom] = useState("");
  const [busy, setBusy] = useState(false);
  const [swapMode, setSwapMode] = useState(false);
  const [swapFirst, setSwapFirst] = useState<TimetableEntryV2 | null>(null);

  const DOW = useMemo(
    () => ["", t("dow1"), t("dow2"), t("dow3"), t("dow4"), t("dow5"), t("dow6"), t("dow7")] as const,
    [t]
  );

  const verStatusLabel = (status: string) => {
    if (status === "active") return t("verStatusActive");
    if (status === "draft") return t("verStatusDraft");
    return t("verStatusArchived");
  };

  const loadVersions = useCallback(async () => {
    try {
      const r = await classAcademicApi.listTimetableVersions(classId);
      setVersions(r.items);
      setSelVer((prev) => {
        if (!r.items.length) return null;
        const active = r.items.find((v) => v.status === "active");
        if (!canManage) {
          return active?.id ?? null;
        }
        if (prev && r.items.some((v) => v.id === prev)) return prev;
        const draft = r.items.find((v) => v.status === "draft");
        return (active ?? draft ?? r.items[0]).id;
      });
    } catch {
      setVersions([]);
      setSelVer(null);
      setLoading(false);
    }
  }, [classId, canManage]);

  const loadBundle = useCallback(async () => {
    const periodFallback = (n: number) => t("periodFallback", { n });
    if (!selVer) {
      setBundleVer(null);
      setEntries([]);
      setBellScheduleName(null);
      setLessonPeriods([]);
      setWorkingDays([1, 2, 3, 4, 5]);
      setBundleEditable(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const b = await classAcademicApi.getTimetable(classId, selVer);
      setBundleVer(b.timetable_version);
      setEntries(b.items ?? []);
      setBundleEditable(b.editable ?? b.timetable_version?.status === "draft");
      const wd = b.working_days?.length ? b.working_days : [1, 2, 3, 4, 5];
      setWorkingDays(wd);
      if (b.bell_schedule?.lesson_periods?.length) {
        setLessonPeriods(b.bell_schedule.lesson_periods);
        setBellScheduleName(b.bell_schedule.name);
      } else {
        setLessonPeriods(derivePeriodsFromEntries(b.items ?? [], periodFallback));
        setBellScheduleName(null);
      }
    } catch {
      setBundleVer(null);
      setEntries([]);
      setBellScheduleName(null);
      setLessonPeriods([]);
      setBundleEditable(false);
    } finally {
      setLoading(false);
    }
  }, [classId, selVer, t]);

  const loadMeta = async () => {
    try {
      const [o, st] = await Promise.all([
        classAcademicApi.listClassSubjects(classId),
        classAcademicApi.listSubjectTeachers(classId),
      ]);
      setOfferings(o.items.filter((x) => x.status === "active"));
      setSubjTeachers(st.items.filter((x) => x.is_active));
    } catch {
      setOfferings([]);
      setSubjTeachers([]);
    }
  };

  useEffect(() => {
    setSelVer(null);
  }, [classId]);

  useEffect(() => {
    loadMeta();
    loadVersions();
  }, [classId, loadVersions]);

  useEffect(() => {
    void loadBundle();
  }, [selVer, loadBundle]);

  const cellMap = useMemo(() => {
    const map = new Map<string, TimetableEntryV2>();
    entries.forEach((e) => map.set(`${e.day_of_week}-${e.period_number}`, e));
    return map;
  }, [entries]);

  const teachersForCs = useMemo(() => {
    if (!csId) return [];
    return subjTeachers.filter((t) => t.class_subject_id === csId);
  }, [csId, subjTeachers]);

  const activeVersion = useMemo(() => versions.find((v) => v.status === "active"), [versions]);

  const openAdd = (d: number, p: number) => {
    if (!bundleVer || !bundleEditable) {
      Alert.alert(t("alertReadOnlyTitle"), t("alertReadOnlyBody"));
      return;
    }
    setEditing(null);
    setDay(d);
    setPeriod(p);
    setCsId(offerings[0]?.id ?? "");
    setTeacherId("");
    setRoom("");
    setModal(true);
  };

  const openEdit = (e: TimetableEntryV2) => {
    if (swapMode) {
      if (!swapFirst) {
        setSwapFirst(e);
        return;
      }
      if (swapFirst.id === e.id) {
        setSwapFirst(null);
        return;
      }
      void doSwap(swapFirst, e);
      return;
    }
    setEditing(e);
    setDay(e.day_of_week);
    setPeriod(e.period_number);
    setCsId(e.class_subject_id);
    setTeacherId(e.teacher_id);
    setRoom(e.room ?? "");
    setModal(true);
  };

  const doSwap = async (a: TimetableEntryV2, b: TimetableEntryV2) => {
    if (!bundleEditable) return;
    setBusy(true);
    try {
      await classAcademicApi.swapTimetableEntries(classId, { entry_a_id: a.id, entry_b_id: b.id });
      setSwapFirst(null);
      setSwapMode(false);
      await qc.invalidateQueries({ queryKey: qk.timetableBundle(classId, selVer) });
      loadBundle();
    } catch (e: unknown) {
      const err = e as Error;
      Alert.alert(t("swapFailed"), err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveEntry = async () => {
    if (!bundleVer) return;
    if (!csId || !teacherId) {
      Alert.alert(t("validationTitle"), t("validationOfferingTeacher"));
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await classAcademicApi.patchTimetableEntry(classId, editing.id, {
          class_subject_id: csId,
          teacher_id: teacherId,
          day_of_week: day,
          period_number: period,
          room: room || null,
        });
      } else {
        await classAcademicApi.createTimetableEntry(classId, {
          timetable_version_id: bundleVer.id,
          class_subject_id: csId,
          teacher_id: teacherId,
          day_of_week: day,
          period_number: period,
          room: room || null,
        });
      }
      await qc.invalidateQueries({ queryKey: qk.timetableBundle(classId, selVer) });
      setModal(false);
      loadBundle();
      loadVersions();
    } catch (e: unknown) {
      const err = e as Error;
      Alert.alert(t("errorTitle"), err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteEntry = (e: TimetableEntryV2) => {
    if (!bundleEditable) return;
    Alert.alert(t("deleteSlotTitle"), t("deleteSlotBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await classAcademicApi.deleteTimetableEntry(classId, e.id);
            await qc.invalidateQueries({ queryKey: qk.timetableBundle(classId, selVer) });
            loadBundle();
          } catch (err: unknown) {
            const e2 = err as Error;
            Alert.alert(t("errorTitle"), e2.message);
          }
        },
      },
    ]);
  };

  const generateNewDraftFromScratch = () => {
    Alert.alert(t("generateNewDraftTitle"), t("generateNewDraftBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("generate"),
        onPress: async () => {
          try {
            const r = await classAcademicApi.generateTimetableDraft(classId);
            const lines = [
              t("placedLine", { placed: r.entries_placed, required: r.total_required }),
              typeof r.unplaced_periods === "number" ? t("unplacedLine", { count: r.unplaced_periods }) : "",
            ].filter(Boolean);
            if (r.warnings?.length) {
              Alert.alert(t("generatedWithWarnings"), `${lines.join("\n")}\n\n${r.warnings.join("\n")}`);
            } else {
              Alert.alert(t("doneTitle"), lines.join("\n"));
            }
            await loadVersions();
            setSelVer(r.timetable_version.id);
            await qc.invalidateQueries({ queryKey: qk.timetableVersions(classId) });
            loadBundle();
          } catch (e: unknown) {
            const ex = e as ApiException;
            const w = (ex.data as { details?: { warnings?: string[] } } | undefined)?.details?.warnings;
            const msg = w?.length ? `${(e as Error).message}\n\n${w.join("\n")}` : (e as Error).message;
            Alert.alert(t("generationFailed"), msg);
          }
        },
      },
    ]);
  };

  const generateDraft = () => {
    if (!bundleVer || bundleVer.status !== "draft") {
      Alert.alert(t("selectDraftTitle"), t("selectDraftBody"));
      return;
    }
    Alert.alert(t("generateDraftTitle"), t("generateDraftBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("generate"),
        onPress: async () => {
          try {
            const r = await classAcademicApi.generateTimetableDraft(classId, {
              timetable_version_id: bundleVer.id,
            });
            const lines = [
              t("placedLine", { placed: r.entries_placed, required: r.total_required }),
              typeof r.unplaced_periods === "number" ? t("unplacedLine", { count: r.unplaced_periods }) : "",
            ].filter(Boolean);
            if (r.warnings?.length) {
              Alert.alert(t("generatedWithWarnings"), `${lines.join("\n")}\n\n${r.warnings.join("\n")}`);
            } else {
              Alert.alert(t("doneTitle"), lines.join("\n"));
            }
            await loadVersions();
            setSelVer(r.timetable_version.id);
            await qc.invalidateQueries({ queryKey: qk.timetableVersions(classId) });
            loadBundle();
          } catch (e: unknown) {
            const ex = e as ApiException;
            const w = (ex.data as { details?: { warnings?: string[] } } | undefined)?.details?.warnings;
            const msg = w?.length ? `${(e as Error).message}\n\n${w.join("\n")}` : (e as Error).message;
            Alert.alert(t("generationFailed"), msg);
          }
        },
      },
    ]);
  };

  const activateDraft = () => {
    if (!bundleVer || bundleVer.status !== "draft") return;
    Alert.alert(t("activateTitle"), t("activateBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("activate"),
        onPress: async () => {
          try {
            await classAcademicApi.activateTimetableVersion(classId, bundleVer.id);
            await loadVersions();
            setSelVer(bundleVer.id);
            loadBundle();
            await qc.invalidateQueries({ queryKey: qk.timetableVersions(classId) });
          } catch (e: unknown) {
            Alert.alert(t("errorTitle"), (e as Error).message);
          }
        },
      },
    ]);
  };

  const newDraft = async () => {
    try {
      const v = await classAcademicApi.createTimetableVersion(classId, { label: "Draft", status: "draft" });
      await loadVersions();
      setSelVer(v.id);
      await qc.invalidateQueries({ queryKey: qk.timetableVersions(classId) });
    } catch (e: unknown) {
      Alert.alert(t("errorTitle"), (e as Error).message);
    }
  };

  const cloneActive = async () => {
    try {
      const v = await classAcademicApi.cloneTimetableVersion(classId, { label: "Copy of active" });
      await loadVersions();
      setSelVer(v.id);
      await qc.invalidateQueries({ queryKey: qk.timetableVersions(classId) });
    } catch (e: unknown) {
      Alert.alert(t("errorTitle"), (e as Error).message);
    }
  };

  const deleteDraft = () => {
    if (!bundleVer || bundleVer.status !== "draft") return;
    Alert.alert(t("deleteDraftTitle"), t("deleteDraftBody"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await classAcademicApi.deleteTimetableVersion(classId, bundleVer.id);
            await loadVersions();
            setSelVer(activeVersion?.id ?? null);
            await qc.invalidateQueries({ queryKey: qk.timetableVersions(classId) });
          } catch (e: unknown) {
            Alert.alert(t("errorTitle"), (e as Error).message);
          }
        },
      },
    ]);
  };

  const periodColWidth = 108;
  const dayLabelWidth = 44;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.verScroll}>
        {versions.map((v) => (
          <TouchableOpacity
            key={v.id}
            style={[styles.verChip, selVer === v.id && styles.verChipOn]}
            onPress={() => setSelVer(v.id)}
          >
            <Text style={[styles.verChipTxt, selVer === v.id && styles.verChipTxtOn]} numberOfLines={1}>
              {v.label || t("versionFallback")}
            </Text>
            <StatusChip
              label={verStatusLabel(v.status)}
              variant={v.status === "active" ? "active" : v.status === "draft" ? "draft" : "inactive"}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {bundleVer && (
        <View style={styles.banner}>
          <Text style={styles.bannerTxt}>
            {bundleVer.label || t("timetableFallback")}
            {t("bannerStatusSep")}
            {verStatusLabel(bundleVer.status)}
            {bellScheduleName ? t("bellSuffix", { name: bellScheduleName }) : ""}
          </Text>
          {!bundleEditable ? (
            <Text style={styles.readOnly}>{t("readOnlyBanner")}</Text>
          ) : null}
          {canManage && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.smallBtn} onPress={newDraft}>
                <Text style={styles.smallBtnTxt}>{t("newDraft")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallBtn} onPress={generateNewDraftFromScratch}>
                <Text style={styles.smallBtnTxt}>{t("newDraftAuto")}</Text>
              </TouchableOpacity>
              {activeVersion ? (
                <TouchableOpacity style={styles.smallBtn} onPress={cloneActive}>
                  <Text style={styles.smallBtnTxt}>{t("cloneActive")}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.smallBtn, !bundleEditable && styles.smallBtnDisabled]}
                onPress={generateDraft}
                disabled={!bundleEditable}
              >
                <Text style={[styles.smallBtnTxt, !bundleEditable && styles.smallBtnTxtDim]}>{t("generate")}</Text>
              </TouchableOpacity>
              {bundleVer.status === "draft" ? (
                <TouchableOpacity style={[styles.smallBtn, styles.actBtn]} onPress={activateDraft}>
                  <Text style={[styles.smallBtnTxt, { color: "#fff" }]}>{t("activate")}</Text>
                </TouchableOpacity>
              ) : null}
              {bundleVer.status === "draft" ? (
                <TouchableOpacity style={styles.smallBtn} onPress={deleteDraft}>
                  <Text style={[styles.smallBtnTxt, { color: Colors.error }]}>{t("deleteDraftBtn")}</Text>
                </TouchableOpacity>
              ) : null}
              {bundleEditable ? (
                <TouchableOpacity
                  style={[styles.smallBtn, swapMode && styles.swapOn]}
                  onPress={() => {
                    setSwapMode(!swapMode);
                    setSwapFirst(null);
                  }}
                >
                  <Text style={styles.smallBtnTxt}>{swapMode ? t("cancelSwap") : t("swapCells")}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
          {swapMode ? (
            <Text style={styles.swapHint}>
              {swapFirst
                ? t("swapSelected", { subject: swapFirst.subject_name ?? "" })
                : t("swapTapTwo")}
            </Text>
          ) : null}
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : !bundleVer ? (
        <Text style={styles.empty}>
          {canManage ? t("emptyNoVersionManage") : t("emptyNoVersionView")}
        </Text>
      ) : lessonPeriods.length === 0 ? (
        <Text style={styles.empty}>{t("emptyNoLessonPeriods")}</Text>
      ) : (
        <ScrollView horizontal>
          <View>
            <View style={styles.gridHeader}>
              <View style={[styles.corner, { width: dayLabelWidth }]} />
              {lessonPeriods.map((lp) => (
                <View key={lp.period_number} style={[styles.hCell, { width: periodColWidth }]}>
                  <Text style={styles.hTxt} numberOfLines={2}>
                    {lp.label || t("periodFallback", { n: lp.period_number })}
                  </Text>
                  <Text style={styles.hSub}>
                    {fmtTime(lp.starts_at)}
                    {lp.starts_at && lp.ends_at ? "–" : ""}
                    {fmtTime(lp.ends_at)}
                  </Text>
                </View>
              ))}
            </View>
            {workingDays.map((d) => (
              <View key={d} style={styles.gridRow}>
                <View style={[styles.pCell, { width: dayLabelWidth }]}>
                  <Text style={styles.pTxt}>{DOW[d]}</Text>
                </View>
                {lessonPeriods.map((lp) => {
                  const p = lp.period_number;
                  const e = cellMap.get(`${d}-${p}`);
                  const conflict = e?.conflict_flags?.length;
                  return (
                    <TouchableOpacity
                      key={`${d}-${p}`}
                      style={[
                        styles.cell,
                        { width: periodColWidth },
                        swapFirst?.id === e?.id && styles.cellSwapSel,
                      ]}
                      onPress={() => (e ? openEdit(e) : canManage && bundleEditable ? openAdd(d, p) : null)}
                      onLongPress={() => e && canManage && bundleEditable && deleteEntry(e)}
                      disabled={(!canManage || !bundleEditable) && !e}
                    >
                      {e ? (
                        <>
                          <View style={styles.cellTitleRow}>
                            <Text style={styles.cSubj} numberOfLines={2}>
                              {e.subject_name}
                            </Text>
                            {conflict ? (
                              <View style={styles.conflictDot}>
                                <Ionicons name="warning" size={12} color={Colors.error} />
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.cTeach} numberOfLines={1}>
                            {e.teacher_name}
                          </Text>
                          <Text style={styles.cTime} numberOfLines={1}>
                            {fmtTime(e.starts_at)}
                            {e.starts_at && e.ends_at ? "–" : ""}
                            {fmtTime(e.ends_at)}
                          </Text>
                        </>
                      ) : (
                        canManage &&
                        bundleEditable && <Ionicons name="add" size={16} color={Colors.textTertiary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <Text style={styles.help}>
        {t("helpGrid")}
        {swapMode ? "" : t("helpSwapSuffix")}
      </Text>

      <Modal visible={modal} animationType="slide" presentationStyle="formSheet">
        <ScrollView style={styles.modal} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? t("modalEditEntry") : t("modalAddEntry")}</Text>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>{t("labelDay")}</Text>
          <View style={styles.rowRoles}>
            {workingDays.map((d) => (
              <TouchableOpacity key={d} style={[styles.mini, day === d && styles.miniOn]} onPress={() => setDay(d)}>
                <Text style={[styles.miniTxt, day === d && styles.miniTxtOn]}>{DOW[d]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>{t("labelPeriod")}</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(period)}
            onChangeText={(t) => setPeriod(parseInt(t, 10) || 1)}
          />
          <Text style={styles.label}>{t("labelClassSubject")}</Text>
          <View style={styles.chips}>
            {offerings.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={[styles.chip, csId === o.id && styles.chipOn]}
                onPress={() => {
                  setCsId(o.id);
                  const prim = subjTeachers.find((x) => x.class_subject_id === o.id && x.role === "primary");
                  setTeacherId(prim?.teacher_id ?? "");
                }}
              >
                <Text style={[styles.chipTxt, csId === o.id && styles.chipTxtOn]} numberOfLines={1}>
                  {o.subject_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>{t("labelTeacher")}</Text>
          <View style={styles.chips}>
            {teachersForCs.map((row) => (
              <TouchableOpacity
                key={row.id}
                style={[styles.chip, teacherId === row.teacher_id && styles.chipOn]}
                onPress={() => setTeacherId(row.teacher_id)}
              >
                <Text
                  style={[styles.chipTxt, teacherId === row.teacher_id && styles.chipTxtOn]}
                  numberOfLines={1}
                >
                  {row.teacher_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {teachersForCs.length === 0 && csId ? (
            <Text style={styles.warn}>{t("warnNoSubjectTeacher")}</Text>
          ) : null}
          <Text style={styles.label}>{t("labelRoomOptional")}</Text>
          <TextInput style={styles.input} value={room} onChangeText={setRoom} placeholder={t("roomPlaceholder")} />
          {editing && canManage && bundleEditable && (
            <TouchableOpacity style={styles.dangerBtn} onPress={() => deleteEntry(editing)}>
              <Text style={styles.dangerTxt}>{t("deleteSlotBtn")}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.primaryBtn} onPress={saveEntry} disabled={busy}>
            <Text style={styles.primaryBtnTxt}>{busy ? t("saving") : t("save")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  verScroll: { marginBottom: Spacing.sm, maxHeight: 56 },
  verChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginRight: Spacing.sm,
    maxWidth: 200,
  },
  verChipOn: { borderColor: Colors.primary, backgroundColor: Colors.primary + "10" },
  verChipTxt: { fontSize: 13, fontWeight: "600" },
  verChipTxtOn: { color: Colors.primary },
  banner: { marginBottom: Spacing.sm },
  bannerTxt: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.xs },
  readOnly: { fontSize: 12, color: Colors.warning, marginBottom: Spacing.xs },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  smallBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  smallBtnDisabled: { opacity: 0.45 },
  smallBtnTxt: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  smallBtnTxtDim: { color: Colors.textSecondary },
  actBtn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  swapOn: { borderColor: Colors.warning, backgroundColor: Colors.warning + "18" },
  swapHint: { fontSize: 12, color: Colors.warning, marginTop: Spacing.xs },
  center: { padding: Spacing.lg, alignItems: "center" },
  empty: { fontSize: 14, color: Colors.textSecondary, fontStyle: "italic", marginBottom: Spacing.md },
  gridHeader: { flexDirection: "row" },
  corner: { height: 36 },
  hCell: {
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
    paddingBottom: 4,
    paddingHorizontal: 2,
  },
  hTxt: { fontSize: 10, fontWeight: "700", color: Colors.textSecondary, textAlign: "center" },
  hSub: { fontSize: 9, color: Colors.textTertiary, textAlign: "center" },
  gridRow: { flexDirection: "row" },
  pCell: {
    justifyContent: "center",
    borderRightWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: Spacing.xs,
  },
  pTxt: { fontSize: 10, color: Colors.textSecondary, fontWeight: "700", textAlign: "center" },
  cell: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 4,
    justifyContent: "center",
  },
  cellSwapSel: { borderColor: Colors.warning, backgroundColor: Colors.warning + "12" },
  cellTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  conflictDot: { marginLeft: 2 },
  cSubj: { flex: 1, fontSize: 10, fontWeight: "700", color: Colors.text },
  cTeach: { fontSize: 9, color: Colors.textSecondary },
  cTime: { fontSize: 9, color: Colors.textTertiary, marginTop: 2 },
  help: { fontSize: 11, color: Colors.textTertiary, marginTop: Spacing.sm },
  modal: { flex: 1, padding: Spacing.lg, backgroundColor: Colors.background },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.md },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "600", marginTop: Spacing.md },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    fontSize: 16,
  },
  rowRoles: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginTop: Spacing.xs },
  mini: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  miniOn: { borderColor: Colors.primary, backgroundColor: Colors.primary + "12" },
  miniTxt: { fontSize: 12 },
  miniTxtOn: { color: Colors.primary, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginTop: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxWidth: "100%",
  },
  chipOn: { borderColor: Colors.primary, backgroundColor: Colors.primary + "12" },
  chipTxt: { fontSize: 12 },
  chipTxtOn: { color: Colors.primary, fontWeight: "700" },
  warn: { color: Colors.warning, marginTop: Spacing.sm, fontSize: 13 },
  dangerBtn: {
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
  },
  dangerTxt: { color: Colors.error, fontWeight: "700" },
  primaryBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  primaryBtnTxt: { color: "#fff", fontWeight: "700" },
});
