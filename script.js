async function generate() {
    const file = document.getElementById("pdf").files[0];
    const count = parseInt(document.getElementById("count").value);
    const resultDiv = document.getElementById("result");
    const downloadBtn = document.getElementById("download");

    let base64 = "";
    if (file) {
        const buffer = await file.arrayBuffer();
        base64 = btoa(
            new Uint8Array(buffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
    }

    let allQuestions = [];
    const totalBatches = count / 5; // count is 20, 40, or 80. batch size is 5.
    let extractedText = "";

    for (let i = 1; i <= totalBatches; i++) {
        resultDiv.textContent = `Generating questions... Batch ${i}/${totalBatches}`;
        
        try {
            const body = { batch: i };
            if (i === 1) {
                body.pdf = base64; // Send PDF only on first batch
            } else {
                body.text = extractedText; // Send extracted text from previous response
            }

            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            
            // Update the source text from backend (received on first call or all calls)
            if (data.extractedText) extractedText = data.extractedText;

            if (data.questions && Array.isArray(data.questions)) {
                allQuestions = allQuestions.concat(data.questions);
            }

            resultDiv.textContent = JSON.stringify(allQuestions, null, 2);
        } catch (err) {
            console.error(err);
            resultDiv.textContent += `\nError in batch ${i}: ${err.message}`;
            break;
        }
    }

    const finalJson = JSON.stringify(allQuestions, null, 2);
    resultDiv.textContent = finalJson;

    const blob = new Blob([finalJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    downloadBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = url;
        a.download = "exam.json";
        a.click();
    };
}