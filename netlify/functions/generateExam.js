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
      "BATCH 1: vocabulary (Complex academic sentences, no definitions.)",
      "BATCH 2: sentence_completion (Advanced logic and coherence.)",
      "BATCH 3: cloze (ONE unified academic paragraph with blanks (1), (2), (3), (4), (5). Questions 1-5 must refer to these.)",
      "BATCH 4: cloze (Second unified academic paragraph with blanks (1), (2), (3), (4), (5).)",
      "BATCH 5: sentence_completion (Emphasis on complex logical transitions.)",
      "BATCH 6: translation (Complex academic sentences with multiple clauses and linkers.)",
      "BATCH 7: paraphrase (Sophisticated semantic restatements.)",
      "BATCH 8: closest_meaning (High-level equivalence testing.)",
      "BATCH 9: reading (ONE substantial 200-word academic passage followed by 5 specific questions.)",
      "BATCH 10: reading (ONE substantial 200-word academic passage followed by 5 specific questions.)",
      "BATCH 11: reading (ONE substantial 200-word academic passage followed by 5 specific questions.)",
      "BATCH 12: reading (ONE substantial 200-word academic passage followed by 5 specific questions.)",
      "BATCH 13: dialogue_completion (Strictly: Person A, Person B, Person A, then Person B: ________________.)",
      "BATCH 14: paragraph_completion (Finding the logically missing sentence.)",
      "BATCH 15: closest_meaning / restatement (Mixed high-level questions.)",
      "BATCH 16: irrelevant_sentence (Finding the sentence that ruins the academic flow.)"
    ]

    const batchInstruction = distributions[batch - 1] || "5 YDS Questions"

    const prompt = `You are a Senior YDS/ÖSYM Examiner. Generate exactly 5 questions for: ${batchInstruction}

STRICT TECHNICAL TEMPLATES:

1. CLOZE TEST: 
   - [Question Field]: MUST start with the ONLY unified paragraph containing (1), (2), (3), (4), (5).
   - Each of the 5 questions must contain this same paragraph followed by "Question (X):".

2. DIALOGUE: 
   - [Question Field]: Must be exactly:
     A: [Complex Opening]
     B: [Specific Response]
     A: [Follow-up]
     B: ________________

3. READING: 
   - [Question Field]: Provide a 200-word scholarship text (History/Science/Arts).
   - Each of the 5 questions must include this text and then a unique comprehension question.

4. TRANSLATION:
   - Must use complex structures like 'Given that', 'Notwithstanding', 'Insofar as'. No simple sentences.

5. QUALITY:
   - Level: C1-C2 Academic.
   - Distractors: Semantically very close. Requires logical deduction.

JSON FORMAT:
{
  "questions": [
    {
      "type": "cloze | reading | dialogue | translation | closest_meaning | etc.",
      "question": "PASSAGE/DIALOGUE CONTENT + THE SPECIFIC QUESTION",
      "choices": ["A) ", "B) ", "C) ", "D) ", "E) "],
      "answer": "Option letter or content",
      "topic": "Academic subject",
      "difficulty": "YDS (Hard)"
    }
  ],
  "extractedText": "${text.replace(/"/g, "'")}"
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