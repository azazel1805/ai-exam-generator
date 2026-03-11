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

    const { pdf: base64, batch } = JSON.parse(event.body)
    const buffer = Buffer.from(base64, "base64")
    const pdfData = await pdf(buffer)
    const text = pdfData.text

    const distributions = [
      "BATCH 1 (Q1-10): 6 Vocabulary questions (Noun, Verb, Adj, Adv, Phrasal Verb) and 4 Grammar questions (Tense, Modals, Passive).",
      "BATCH 2 (Q11-20): 10 questions for 2 Cloze Test passages. Format: Provide a short passage with (1), (2), (3), (4), (5) blanks, then 5 multiple choice questions for those blanks. Repeat for second passage.",
      "BATCH 3 (Q21-30): 10 Sentence Completion questions (Completing the other half of a given sentence).",
      "BATCH 4 (Q31-40): 6 English-to-Turkish and 4 Turkish-to-English Translation questions.",
      "BATCH 5 (Q41-50): 10 Reading questions based on 2 separate academic passages (5 questions each). Include the passage in each 'question' field or once per group.",
      "BATCH 6 (Q51-60): 10 Reading questions based on 2 separate academic passages (5 questions each).",
      "BATCH 7 (Q61-70): 5 Dialogue Completion and 5 Restatement (Closest meaning) questions.",
      "BATCH 8 (Q71-80): 5 Paragraph Completion (Finding the missing sentence) and 5 Irrelevant Sentence (Finding the sentence that ruins the flow) questions."
    ]

    const batchInstruction = distributions[batch - 1] || "10 YDS Questions"

    const prompt = `
Act as an expert YDS/YDT Examiner. Generate exactly 10 high-quality questions for this specific part: ${batchInstruction}

YDS RULES:
- Vocabulary: Use high-level academic terms.
- Cloze Test: Provide the TEXT first with blanks (1) to (5), then questions 1-5 for those blanks.
- Reading: Provide an academic PASSAGE first, then 5 questions about it.
- Restatement: The original sentence should be complex and academic.
- Distractors: All choices (A-E) must be plausible and follow the same grammatical structure.

OUTPUT REQUIREMENT:
Return ONLY a JSON object with a root key "questions" containing an array of 10 objects.

Format Example:
{
  "questions": [
    {
      "type": "Vocab | Grammar | Cloze | SentenceComp | Translation | Reading | Dialogue | Restatement | ParaComp | Irrelevant",
      "question": "The question text. FOR CLOZE/READING: Include the passage here if it's the first time.",
      "choices": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
      "answer": "A",
      "topic": "Subject name",
      "difficulty": "YDS"
    }
  ]
}

PDF TEXT FOR INSPIRATION:
${text.substring(0, 10000)}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: "You are an official exam generator. Output must be a JSON object with 'questions' key." },
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