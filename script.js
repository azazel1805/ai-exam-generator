async function generate() {
    const file = document.getElementById("pdf").files[0];
    const resultDiv = document.getElementById("result");
    const downloadBtn = document.getElementById("download");

    if (!file) {
        alert("Upload PDF");
        return;
    }

    resultDiv.textContent = "Processing PDF...";
    const buffer = await file.arrayBuffer();
    const base64 = btoa(
        new Uint8Array(buffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    let allQuestions = [];
    const totalBatches = 8; // 8 batches of 10 = 80 questions

    for (let i = 1; i <= totalBatches; i++) {
        resultDiv.textContent = `Generating questions... Batch ${i}/${totalBatches}`;
        
        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                body: base64
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            
            // Check if response is the expected JSON object or array
            let questions = data;
            if (data.questions) questions = data.questions; // Handle if model wraps it in a "questions" key
            if (!Array.isArray(questions)) {
                // Occurs if model returns a single object containing the array
                questions = Object.values(data).find(Array.isArray) || [];
            }

            allQuestions = allQuestions.concat(questions);
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