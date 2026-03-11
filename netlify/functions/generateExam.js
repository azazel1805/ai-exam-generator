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
      "Q1-5: vocabulary (Advanced academic/contextual)",
      "Q6-10: sentence_completion (Logical connectors, complex structures)",
      "Q11-15: cloze (1 unified paragraph with 5 numbered blanks (1-5))",
      "Q16-20: cloze (1 unified paragraph with 5 numbered blanks (1-5))",
      "Q21-25: sentence_completion (Focus on connector traps and logic)",
      "Q26-30: translation (Academic level context)",
      "Q31-35: paraphrase (Preserve meaning, change structure)",
      "Q36-40: closest_meaning (Advanced paraphrase recognition)",
      "Q41-45: Reading Passage 1 (Passage + 5 questions)",
      "Q46-50: Reading Passage 2 (Passage + 5 questions)",
      "Q51-55: Reading Passage 3 (Passage + 5 questions)",
      "Q56-60: Reading Passage 4 (Passage + 5 questions)",
      "Q61-65: dialogue_completion (Format: A: B: A: B: ----)",
      "Q66-70: paragraph_completion (Academic coherence)",
      "Q71-75: closest_meaning / restatement",
      "Q76-80: irrelevant_sentence (Coherence detection)"
    ]

    const batchInstruction = distributions[batch - 1] || "5 YDS Questions"

    const prompt = `You are an expert YDS/YDT exam writer. Generate a portion of an academic English exam.
Current Target: ${batchInstruction}

RULES:
- Use C1-C2 level academic English.
- Ensure that questions require logical reasoning rather than simple vocabulary recognition.
- Distractors must be semantically and contextually close.
- FORMAT for Dialogue: Exactly 4 lines: Person A, Person B, Person A, then Person B: ____________________.
- FORMAT for Cloze: Provide ONE cohesive passage first (with blanks 1-5), then 5 multiple choice questions.
- Return ONLY a JSON object with 'questions' and 'extractedText'.

JSON FORMAT:
{
  "questions": [
    {
      "type": "vocabulary | sentence_completion | cloze | translation | paraphrase | dialogue | paragraph_completion | closest_meaning | irrelevant_sentence",
      "question": "The question text or passage",
      "choices": ["A) ", "B) ", "C) ", "D) ", "E) "],
      "answer": "The correct choice text",
      "topic": "The academic subject (e.g., Biology, Sociology)",
      "difficulty": "YDS"
    }
  ],
  "extractedText": "${text}"
}`

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