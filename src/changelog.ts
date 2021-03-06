import fs from "fs/promises"

import dedent from "ts-dedent"

import * as core from "@actions/core"
import { Change, CriticalityLevel } from "@graphql-inspector/core"

import { Options } from "./options"

const leadingZero = (num: number) => `${num < 10 ? "0" : ""}${num}`

export const createChangelogEntry = (changes: Change[]) => {
  const now = new Date()

  // Filter out changes that are detected every time
  const filteredChanges = changes.filter(
    (change) =>
      !change.path?.startsWith("@deprecated") && !change.path?.startsWith("@specifiedBy"),
  )

  if (filteredChanges.length === 0) {
    core.info("No changes detected. Exiting ealy.")
    return null
  }

  const breaking = filteredChanges.filter(
    ({ criticality }) => criticality.level === CriticalityLevel.Breaking,
  )
  const dangerous = filteredChanges.filter(
    ({ criticality }) => criticality.level === CriticalityLevel.Dangerous,
  )
  const normal = filteredChanges.filter(
    ({ criticality }) => criticality.level === CriticalityLevel.NonBreaking,
  )

  return dedent`
    ## ${now.getFullYear()}-${leadingZero(now.getMonth())}-${leadingZero(
    now.getDay(),
  )} ${leadingZero(now.getHours())}:${leadingZero(now.getMinutes())}
    ${
      breaking.length > 0
        ? dedent`
          ### 🔺 Breaking

          ${breaking
            .map(
              (change) => `- \`${change.path!}\`: ${change.message.replace(/'/g, "`")}`,
            )
            .join("\n")}\n
        `
        : ""
    }
    ${
      dangerous.length > 0
        ? dedent`
          ### ⚠ Dangerous

          ${dangerous
            .map(
              (change) => `- \`${change.path!}\`: ${change.message.replace(/'/g, "`")}`,
            )
            .join("\n")}\n
        `
        : ""
    }
    ${
      normal.length > 0
        ? dedent`
          ### ✅ Non-breaking

          ${normal
            .map(
              (change) => `- \`${change.path!}\`: ${change.message.replace(/'/g, "`")}`,
            )
            .join("\n")}\n
        `
        : ""
    }
  `
}

export const addChangelogEntry = async (
  { changelogFile }: Pick<Options, "changelogFile">,
  entry: string,
) => {
  const contents = await fs.readFile(changelogFile, "utf8")
  const contentLines = contents.split("\n")
  const entryLine = contentLines.findIndex((line) => line.startsWith("## 20"))

  const newContents = [
    ...contentLines.slice(0, entryLine),
    ...entry.split("\n"),
    ...contentLines.slice(entryLine),
  ].join("\n")

  await fs.writeFile(changelogFile, newContents)
}
