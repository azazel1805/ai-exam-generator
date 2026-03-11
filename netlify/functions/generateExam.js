import OpenAI from "openai"
import pdf from "pdf-parse"

export async function handler(event){

if(event.httpMethod !== "POST"){
return {statusCode:405,body:"Method not allowed"}
}

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
})

try{

    const body = JSON.parse(event.body)
    let text = body.text || ""
    const batch = body.batch || 1

    // İlk istekte PDF ayıkla, sonrakilerde frontend'den gelen metni kullan
    if (!text && body.pdf) {
      const buffer = Buffer.from(body.pdf, "base64")
      const pdfData = await pdf(buffer)
      text = pdfData.text.substring(0, 10000).replace(/[\r\n]+/g, " ")
    }

    if (!text) {
      text = "General Academic Topics: Environment, Technology, History, Sociology, Global Economics, Psychology, and Medical Advances."
    }

    const distributions = [
      "BATCH 1: vocabulary (Must be a complex academic sentence with one blank. No definitions. Test high-level usage.)",
      "BATCH 2: sentence_completion (Academic logic, causal/concessive structures, connector traps.)",
      "BATCH 3: cloze (Provide ONE cohesive academic paragraph with markers (1), (2), (3), (4), (5). Then 5 questions for these markers.)",
      "BATCH 4: cloze (Second set of ONE cohesive academic paragraph with markers (1)-(5).)",
      "BATCH 5: sentence_completion (Advanced logical relationship testing.)",
      "BATCH 6: translation (Complex academic text, professional style.)",
      "BATCH 7: paraphrase (Sophisticated restatement of complex scholarly sentences.)",
      "BATCH 8: closest_meaning (Subtle differences in meaning recognition.)",
      "BATCH 9: Reading Passage 1 (Provide a 150-200 word academic text, then 5 deep comprehension questions.)",
      "BATCH 10: Reading Passage 2 (Separate academic topic, 5 questions.)",
      "BATCH 11: Reading Passage 3 (Separate academic topic, 5 questions.)",
      "BATCH 12: Reading Passage 4 (Final academic topic, 5 questions.)",
      "BATCH 13: dialogue_completion (Strictly 4 lines: A, B, A, then B: ________________. Logic-based.)",
      "BATCH 14: paragraph_completion (Finding the logically missing sentence to maintain flow.)",
      "BATCH 15: paraphrase / closest_meaning (Mixed advanced types.)",
      "BATCH 16: irrelevant_sentence (Academic text where one sentence disrupts the logical coherence.)"
    ]

    const batchInstruction = distributions[batch - 1] || "5 YDS Questions"

    const prompt = `You are an expert YDS/ÖSYM examiner. Generate 5 questions for: ${batchInstruction}

TECHNICAL SPECS:
- LEVEL: C1-C2 Academic English. Use sophisticated vocabulary (e.g. 'unprecedented', 'attribute to', 'prevalent').
- VOCABULARY: Must be a full, formal sentence with a blank. Do not ask for definitions.
- CLOZE TEST: Provide a single paragraph. Insert numbers (1) to (5) in brackets. Questions MUST reference these numbers.
- DIALOGUE: Provide 4 lines. Line 1 (A), Line 2 (B), Line 3 (A), Line 4 (B: ________________).
- READING: Provide a substantial academic passage (Science, Arts, or History). Each of the 5 questions must relate to this same passage.
- REASONING: Questions must require understanding of nuance, tone, or logical transition, not just word recognition.

Format: Return a JSON object with:
"questions": [ { "type": "...", "question": "...", "choices": ["A) ", "B) ", "C) ", "D) ", "E) "], "answer": "A", "topic": "...", "difficulty": "YDS" } ],
"extractedText": "See context below"

CONTEXT: ${text.replace(/"/g, "'")}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: "You are an official exam developer. Return strictly JSON with 'questions' and 'extractedText'." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: completion.choices[0].message.content
    }

}catch(err){

return{
statusCode:500,
body:JSON.stringify(err.message)
}

}

}