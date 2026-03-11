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

    // Dağılım mantığı: 8 batch x 10 soru = 80 soru
    const distributions = [
      "10 Sentence Completion",
      "10 Sentence Completion",
      "10 Vocabulary",
      "5 Vocabulary and 5 Paraphrase",
      "10 Paraphrase",
      "10 Translation (TR -> EN or EN -> TR)",
      "10 Paragraph Completion",
      "10 Dialogue Completion"
    ]

    const batchInstruction = distributions[batch - 1] || "10 YDS Questions"

    const prompt = `
Generate 10 realistic YDS/YDT style English questions as part of a larger exam.
This batch must focus on: ${batchInstruction}

Rules:
- Questions must resemble official YDS style.
- Use academic vocabulary.
- Distractors must be plausible.
- Avoid repeating structures like "The recent study revealed".
- Use different sentence openings.
- No copying from text, use it for inspiration only.

Return ONLY raw JSON.

Format:
[
  {
    "type": "",
    "question": "",
    "choices": ["", "", "", "", ""],
    "answer": "",
    "topic": "",
    "difficulty": "YDS"
  }
]

PDF TEXT FOR INSPIRATION:
${text.substring(0, 10000)}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        { role: "system", content: "You are a professional YDS exam creator. Return strictly JSON." },
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