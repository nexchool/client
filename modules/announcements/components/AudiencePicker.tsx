import React, { useState, useEffect } from 'react';
import { Modal, Pressable, View, FlatList } from 'react-native';
import { useTheme } from '@/common/theme';
import { Text } from '@/common/components/Text';
import { Input } from '@/common/components/Input';
import { Link } from '@/common/components/Link';
import { useClasses } from '@/modules/finance/hooks/useFinance';
import { useStudents } from '@/modules/students/hooks/useStudents';
import type { AudienceJson, AudienceRole, AudienceScope } from '../types';
import { AUDIENCE_SCOPE_OPTIONS, AUDIENCE_ROLE_OPTIONS } from '../constants';

type Props = {
  value: AudienceJson;
  onChange: (next: AudienceJson) => void;
  error?: string;
};

const DEFAULT_BY_SCOPE: Record<AudienceScope, AudienceJson> = {
  all: { scope: 'all' },
  roles: { scope: 'roles', roles: [] },
  classes: { scope: 'classes', class_ids: [] },
  students: { scope: 'students', student_ids: [] },
};

export function AudiencePicker({ value, onChange, error }: Props) {
  const { palette, spacing, radius } = useTheme();
  const { data: classes = [] } = useClasses();
  const { students, fetchStudents } = useStudents();
  const [studentSheetVisible, setStudentSheetVisible] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (value.scope === 'students' && students.length === 0) {
      fetchStudents().catch(() => {});
    }
  }, [value.scope, students.length, fetchStudents]);

  const handleScopeChange = (nextScope: AudienceScope) => {
    if (nextScope === value.scope) return;
    onChange(DEFAULT_BY_SCOPE[nextScope]);
  };

  const toggleRole = (r: AudienceRole) => {
    if (value.scope !== 'roles') return;
    const set = new Set(value.roles ?? []);
    if (set.has(r)) set.delete(r); else set.add(r);
    onChange({ scope: 'roles', roles: Array.from(set) });
  };

  const toggleClass = (id: string) => {
    if (value.scope !== 'classes') return;
    const set = new Set(value.class_ids ?? []);
    if (set.has(id)) set.delete(id); else set.add(id);
    onChange({ scope: 'classes', class_ids: Array.from(set) });
  };

  const toggleStudent = (id: string) => {
    if (value.scope !== 'students') return;
    const set = new Set(value.student_ids ?? []);
    if (set.has(id)) set.delete(id); else set.add(id);
    onChange({ scope: 'students', student_ids: Array.from(set) });
  };

  const filteredStudents = studentSearch.trim()
    ? students.filter((s: { name?: string }) => (s.name ?? '').toLowerCase().includes(studentSearch.toLowerCase()))
    : students;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="labelMd" color="onSurfaceVariant">Audience</Text>

      {/* Scope segments */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {AUDIENCE_SCOPE_OPTIONS.map((opt) => {
          const active = value.scope === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => handleScopeChange(opt.value as AudienceScope)}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                backgroundColor: active ? palette.tertiaryContainer : palette.surfaceContainerLowest,
                borderWidth: active ? 0 : 1,
                borderColor: palette.outlineVariant,
                opacity: pressed ? 0.85 : 1,
                minHeight: 44,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text variant="labelMd" color={active ? 'onTertiaryContainer' : 'onSurface'}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Secondary picker per scope */}
      {value.scope === 'all' ? (
        <Text variant="bodyMd" color="onSurfaceVariant">
          Everyone in the school will receive this.
        </Text>
      ) : null}

      {value.scope === 'roles' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {AUDIENCE_ROLE_OPTIONS.map((r) => {
            const active = (value.roles ?? []).includes(r.value);
            return (
              <Pressable
                key={r.value}
                onPress={() => toggleRole(r.value)}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  backgroundColor: active ? palette.primaryContainer : palette.surfaceContainerLowest,
                  borderWidth: active ? 0 : 1,
                  borderColor: palette.outlineVariant,
                  opacity: pressed ? 0.85 : 1,
                  minHeight: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Text variant="labelMd" color={active ? 'onPrimaryContainer' : 'onSurface'}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {value.scope === 'classes' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {classes.map((c: { id: string; name?: string }) => {
            const active = (value.class_ids ?? []).includes(c.id);
            return (
              <Pressable
                key={c.id}
                onPress={() => toggleClass(c.id)}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  backgroundColor: active ? palette.primaryContainer : palette.surfaceContainerLowest,
                  borderWidth: active ? 0 : 1,
                  borderColor: palette.outlineVariant,
                  opacity: pressed ? 0.85 : 1,
                  minHeight: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Text variant="labelMd" color={active ? 'onPrimaryContainer' : 'onSurface'}>
                  {c.name ?? c.id}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {value.scope === 'students' ? (
        <View>
          <Pressable
            onPress={() => setStudentSheetVisible(true)}
            style={({ pressed }) => ({
              padding: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: palette.surfaceContainerLowest,
              borderWidth: 1,
              borderColor: palette.outlineVariant,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text variant="bodyMd" color="onSurface">
              {(value.student_ids ?? []).length} student(s) selected · tap to edit
            </Text>
          </Pressable>

          <Modal
            visible={studentSheetVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setStudentSheetVisible(false)}
          >
            <Pressable
              onPress={() => setStudentSheetVisible(false)}
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
            >
              <Pressable
                onPress={(e) => e.stopPropagation()}
                style={{
                  marginTop: 'auto',
                  height: '85%',
                  backgroundColor: palette.surfaceContainerLowest,
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                  padding: spacing.lg,
                  gap: spacing.md,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 40, height: 4, borderRadius: radius.sm, backgroundColor: palette.outlineVariant }} />
                </View>
                <Text variant="headlineMd" color="onSurface">Pick students</Text>
                <Input
                  label=""
                  value={studentSearch}
                  onChangeText={setStudentSearch}
                  placeholder="Search by name"
                />
                <FlatList
                  data={filteredStudents}
                  keyExtractor={(s: { id: string }) => s.id}
                  renderItem={({ item }: { item: { id: string; name?: string; admission_number?: string } }) => {
                    const active = (value.student_ids ?? []).includes(item.id);
                    return (
                      <Pressable
                        onPress={() => toggleStudent(item.id)}
                        style={({ pressed }) => ({
                          paddingVertical: spacing.md,
                          paddingHorizontal: spacing.sm,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          opacity: pressed ? 0.85 : 1,
                          backgroundColor: active ? `${palette.primary}11` : 'transparent',
                          borderRadius: radius.md,
                        })}
                      >
                        <Text variant="bodyMd" color="onSurface">{item.name ?? item.id}</Text>
                        <Text variant="labelSm" color="onSurfaceVariant">
                          {active ? '✓' : item.admission_number ?? ''}
                        </Text>
                      </Pressable>
                    );
                  }}
                  ItemSeparatorComponent={() => (
                    <View style={{ height: 1, backgroundColor: palette.outlineVariant }} />
                  )}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link onPress={() => setStudentSheetVisible(false)}>Done</Link>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      ) : null}

      {error ? (
        <Text variant="labelSm" color="error" style={{ marginTop: spacing.xs }}>{error}</Text>
      ) : null}
    </View>
  );
}
