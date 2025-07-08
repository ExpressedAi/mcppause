import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { userInput, enhancementPrompt } = await req.json()

    if (!userInput?.trim()) {
      return new Response(JSON.stringify({ error: "No input provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Use the dedicated API key for prompt enhancement
    const openrouter = createOpenRouter({
      apiKey: "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",
    })

    const defaultEnhancementPrompt = `You are a prompt enhancement specialist. Your job is to take casual, natural language input and transform it into clear, effective prompts that will get better results from AI systems.

Guidelines:
- Make the intent crystal clear
- Add helpful context and structure
- Specify the desired output format when relevant
- Include any necessary constraints or requirements
- Keep the enhanced prompt concise but comprehensive
- Preserve the original meaning while making it more actionable

Transform this user input into an enhanced prompt:`

    const systemPrompt = enhancementPrompt || defaultEnhancementPrompt

    console.log("🔄 Enhancing prompt with gpt-4.1-nano...")

    const { text } = await generateText({
      model: openrouter.chat("openai/gpt-4.1-nano"),
      system: systemPrompt,
      prompt: userInput,
      temperature: 0.7,
      maxTokens: 500,
    })

    console.log("✅ Prompt enhanced successfully")

    return new Response(
      JSON.stringify({
        originalInput: userInput,
        enhancedPrompt: text,
        model: "gpt-4.1-nano",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("💥 Prompt enhancement error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to enhance prompt",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
