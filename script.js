async function generate(){

const file=document.getElementById("pdf").files[0]

if(!file){
alert("Upload PDF")
return
}

const buffer=await file.arrayBuffer()

const base64=btoa(
new Uint8Array(buffer)
.reduce((data,byte)=>data+String.fromCharCode(byte),'')
)

const res=await fetch("/api/generate",{
method:"POST",
body:base64
})

const json=await res.text()

document.getElementById("result").textContent=json

const blob=new Blob([json],{type:"application/json"})
const url=URL.createObjectURL(blob)

document.getElementById("download").onclick=()=>{
const a=document.createElement("a")
a.href=url
a.download="exam.json"
a.click()
}

}