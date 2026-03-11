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
      "Q1-5: Vocabulary (Noun, Verb, Adj, Adv, Phrasal Verb)",
      "Q6-10: Grammar (Tense, Modals, Passive, Conjunctions)",
      "Q11-15: Cloze Test Passage 1 (1 passage, 5 blanks, 5 questions)",
      "Q16-20: Cloze Test Passage 2 (1 passage, 5 blanks, 5 questions)",
      "Q21-25: Sentence Completion Group 1",
      "Q26-30: Sentence Completion Group 2",
      "Q31-35: English-to-Turkish Translation",
      "Q36-40: Turkish-to-English Translation",
      "Q41-45: Reading Passage 1 (Passage + 5 questions)",
      "Q46-50: Reading Passage 2 (Passage + 5 questions)",
      "Q51-55: Reading Passage 3 (Passage + 5 questions)",
      "Q56-60: Reading Passage 4 (Passage + 5 questions)",
      "Q61-65: Dialogue Completion",
      "Q66-70: Restatement / Closest Meaning",
      "Q71-75: Paragraph Completion (Missing sentence)",
      "Q76-80: Irrelevant Sentence (Odd one out)"
    ]

    const batchInstruction = distributions[batch - 1] || "5 YDS Questions"

    const prompt = `
Act as a Senior Examiner for the YDS (Foreign Language Proficiency Exam).
Generate exactly 5 questions for: ${batchInstruction}
Using this inspiration text/context: ${text}

STRICT QUALITY RULES:
1. DIFFICULTY: Questions must be C1-C2 level (Advanced Academic English).
2. STYLE: Strictly resemble official YDS examiner style. Avoid "simple ESL quiz" or "high school level" patterns.
3. VOCABULARY: Use high-level academic vocabulary (e.g., exacerbated, intertwined, resilient, proliferation, paradigm).
4. DISTRACTORS: Options must be semantically and contextually close. A student must need deep reasoning to distinguish the correct answer.
5. CONTEXT: Use formal, scholarly, or scientific tone only.

Format: Return a JSON object with:
"questions": array of objects, each containing { "type": "...", "question": "...", "choices": ["A) ", "B) ", ...], "answer": "A", "topic": "...", "difficulty": "YDS" }
"extractedText": exact string context provided above.`

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