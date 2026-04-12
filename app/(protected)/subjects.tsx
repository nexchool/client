import { Redirect } from "expo-router";

/** Deep links to /subjects redirect home — subject master is admin-web only. */
export default function LegacySubjectsRedirect() {
  return <Redirect href="/(protected)/home" />;
}
