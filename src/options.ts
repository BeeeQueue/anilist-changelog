import * as zod from "zod"

const trim = (str: string) => str.trim()

export const optionsSchema = zod.object({
  endpoint: zod.string().url().transform(trim),
  schemaFile: zod
    .string()
    .regex(/^(\/)?([^/0]+(\/)?)+$/)
    .transform(trim),
})
