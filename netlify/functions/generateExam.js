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

    // Gerçek YDS Soru Dağılımı (80 Soru)
    const distributions = [
      "Questions 1-10: 6 Vocabulary (Noun, Verb, Adj, Adv, Phrasal Verb) and 4 Grammar (Tense, Preposition, Conjunction)",
      "Questions 11-20: 2 Grammar and 8 Cloze Test (Two passages, 5 questions each - testing vocabulary, grammar, and linkers)",
      "Questions 21-30: 10 Sentence Completion (Logic-based halves of complex sentences)",
      "Questions 31-40: 6 English-Turkish Translation and 4 Turkish-English Translation",
      "Questions 41-50: 2 Reading Passages (Short academic texts, 5 questions each: Main idea, Inference, Direct detail)",
      "Questions 51-60: 2 Reading Passages (Short academic texts, 5 questions each)",
      "Questions 61-70: 5 Dialogue Completion and 5 Restatement (Closest meaning/Paraphrase)",
      "Questions 71-80: 5 Paragraph Completion (Finding the missing sentence) and 5 Irrelevant Sentence (Finding the one that breaks unity)"
    ]

    const batchInstruction = distributions[batch - 1] || "10 YDS Questions"

    const prompt = `
Act as an expert YDS/YDT Examiner. Generate 10 high-quality questions for an English Proficiency Exam.
Current Target: ${batchInstruction}

YDS QUALITY STANDARDS:
1. Vocabulary: Focus on academic words (e.g., fluctuate, undermine, precursor, prevalent).
2. Grammar: Use sophisticated structures (Reduced relative clauses, inversions, mixed conditionals).
3. Reading/Cloze: Texts must be on academic topics (Science, History, Psychology, Sociology) with formal tone.
4. Distractors: Create "near-miss" options that sound plausible but have a logical or grammatical flaw.
5. Context: Use text inspiration to maintain the same difficulty level, but do not copy sentences.

Return ONLY raw JSON.

Format:
[
  {
    "type": "Vocabulary | Grammar | Cloze Test | Sentence Completion | Translation | Reading | Dialogue | Restatement | Paragraph Completion | Irrelevant",
    "question": "The question text, including the passage if it is Reading or Cloze Test",
    "choices": ["A", "B", "C", "D", "E"],
    "answer": "Option letter or exact text",
    "topic": "Specific subject (e.g., Phrasal Verbs, Relative Clauses)",
    "difficulty": "YDS (High Academic)"
  }
]

PDF TEXT FOR INSPIRATION:
${text.substring(0, 10000)}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: "You are the head of a National Testing Center producing YDS exams. Always provide structured, valid JSON." },
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