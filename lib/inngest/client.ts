import { Inngest} from "inngest";

export const inngest = new Inngest({
    id: 'swiftiq-finance',
    ai: { gemini: { apiKey: process.env.GEMINI_API_KEY! }}
})
