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

const buffer = Buffer.from(event.body,"base64")

const pdfData = await pdf(buffer)

const text = pdfData.text

const prompt = `Based on the attached PDF text, generate 80 NEW YDS/YDT style English questions.
    Rules: No copying, no slight modifications, original sentences only.
    Format: JSON array of objects with keys: question, choices[], answer, topic, difficulty.
    PDF TEXT: ${text.substring(0, 10000)}` // Limit input text to save tokens

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cheapest reliable model
      temperature: 0.3,
      messages: [
        { role: "system", content: "You are a cost-efficient exam generator. Return ONLY raw JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" } // Ensures efficiency and valid JSON
    })

return{
statusCode:200,
headers:{
"Content-Type":"application/json"
},
body:completion.choices[0].message.content
}

}catch(err){

return{
statusCode:500,
body:JSON.stringify(err.message)
}

}

}