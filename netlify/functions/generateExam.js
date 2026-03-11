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
Act as a Senior Examiner for the YDS (National English Exam). 
Generate exactly 5 questions for: ${batchInstruction}
Context: ${text}

STRICT ARCHITECTURAL RULES:
1. NO DEFINITIONS: Avoid "Which term refers to..." style. Vocab must be tested within complex, high-level academic sentences.
2. LOGICAL REASONING: Questions MUST require logical reasoning. Avoid simple vocabulary recognition; the student must understand the relationship between ideas (cause-effect, contrast, concession) to find the answer.
3. CLOZE TEST: You MUST provide ONE UNIFIED PARAGRAPH with blanks (1), (2), (3), (4), and (5). Do NOT use single-sentence cloze.
4. DIALOGUE FORMAT: Exact 4-line exchange (A-B-A-B ----). The final response must logically complete the specific flow of the conversation.
5. CONNECTOR TRAPS: Use deceptive conjunctions and focus on paragraph coherence. Distractors must be semantically close but logically flawed.
6. VARIETY: C1-C2 level English. Avoid duplicate sentence structures. Formal, scholarly tone only.

Format: Return JSON object with:
"questions": [ { "type": "...", "question": "...", "choices": ["A) ", "B) ", "C) ", "D) ", "E) "], "answer": "A", "topic": "...", "difficulty": "YDS" } ],
"extractedText": "${text}"`

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