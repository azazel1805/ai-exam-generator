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
      "Q1-5: Vocabulary - Must be embedded in complex academic sentences. NO definitions.",
      "Q6-10: Grammar - Advanced structures (Inversion, Conditionals, Modals) in context.",
      "Q11-15: Cloze Test Passage 1 - ONE cohesive academic paragraph with 5 numbered blanks (1-5), followed by 5 separate questions for those specific blanks.",
      "Q16-20: Cloze Test Passage 2 - ONE cohesive academic paragraph with 5 numbered blanks (1-5), followed by 5 separate questions for those specific blanks.",
      "Q21-25: Sentence Completion Group 1 - Logical and grammatical completion of complex sentences.",
      "Q26-30: Sentence Completion Group 2.",
      "Q31-35: English-to-Turkish Translation - Academic level sentences.",
      "Q36-40: Turkish-to-English Translation.",
      "Q41-45: Reading Passage 1 - A long academic text followed by 5 comprehension questions.",
      "Q46-50: Reading Passage 2.",
      "Q51-55: Reading Passage 3.",
      "Q56-60: Reading Passage 4.",
      "Q61-65: Dialogue Completion - Professional/Academic context dialogues.",
      "Q66-70: Restatement / Closest Meaning - Sophisticated paraphrasing.",
      "Q71-75: Paragraph Completion - Finding the logically missing sentence in a paragraph.",
      "Q76-80: Irrelevant Sentence - Identifying the sentence that disrupts the scholarly flow."
    ]

    const batchInstruction = distributions[batch - 1] || "5 YDS Questions"

    const prompt = `
Act as a Senior YDS Examiner. Generate exactly 5 questions for: ${batchInstruction}
Context/Inspiration: ${text}

STRICT ARCHITECTURAL RULES:
1. NO DEFINITIONS: Never ask "What does X mean?" or "Which term refers to...". All questions MUST be embedded in context.
2. VOCABULARY: Vocabulary must be tested within a scholarly, high-level academic sentence where the meaning is derived from context.
3. CLOZE TEST FORMAT: You MUST provide ONE unified paragraph. Inside this paragraph, place five numbered blanks: (1), (2), (3), (4), and (5). After the paragraph, provide 5 questions, each corresponding to one of those numbers.
4. READING FORMAT: Provide ONE academic passage, then 5 questions.
5. LEVEL: C1-C2 Academic English only.
6. DISTRACTORS: Must be semantically close and professionally confusing.

Format: Return a JSON object with:
"questions": array of objects { "type": "...", "question": "...", "choices": ["A) ", "B) ", "C) ", "D) ", "E) "], "answer": "A", "topic": "...", "difficulty": "YDS" }
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