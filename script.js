const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");

let imageBase64 = "";

imageInput.addEventListener("change", e => {

const file = e.target.files[0];

preview.src = URL.createObjectURL(file);
preview.hidden = false;

const reader = new FileReader();

reader.onload = () => {
imageBase64 = reader.result.split(",")[1];
};

reader.readAsDataURL(file);

});

document.getElementById("analyzeBtn")
.addEventListener("click", analyzeFood);

async function analyzeFood(){

const loading = document.getElementById("loading");

loading.innerHTML = "Analyzing with AI...";

try{

const visionResponse = await fetch(
`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_KEY}`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
requests:[
{
image:{
content:imageBase64
},
features:[
{
type:"LABEL_DETECTION",
maxResults:10
}
]
}
]
})
});

const visionData = await visionResponse.json();

const labels =
visionData.responses[0].labelAnnotations;

const food =
labels[0].description;

const nutritionResponse = await fetch(
`https://api.nal.usda.gov/fdc/v1/foods/search?query=${food}&api_key=${USDA_API_KEY}`
);

const nutritionData =
await nutritionResponse.json();

const item = nutritionData.foods[0];

const nutrients = item.foodNutrients;

let protein = 0;
let fat = 0;
let carbs = 0;

nutrients.forEach(n=>{

if(n.nutrientName==="Protein")
protein=n.value;

if(n.nutrientName==="Total lipid (fat)")
fat=n.value;

if(n.nutrientName==="Carbohydrate, by difference")
carbs=n.value;

});

const calories =
protein*4 + carbs*4 + fat*9;

showResult(
food,
Math.round(calories),
protein,
fat,
carbs
);

loading.innerHTML="";

}catch(err){

loading.innerHTML =
"Unable to analyze image.";

console.error(err);

}

}

function showResult(
food,
calories,
protein,
fat,
carbs
){

document.getElementById("resultCard")
.hidden=false;

document.getElementById("foodName")
.innerText=food;

document.getElementById("calories")
.innerText=calories+" kcal";

document.getElementById("protein")
.innerText=protein+" g";

document.getElementById("fat")
.innerText=fat+" g";

document.getElementById("carbs")
.innerText=carbs+" g";

new Chart(
document.getElementById("macroChart"),
{
type:"doughnut",
data:{
labels:[
"Protein",
"Fat",
"Carbs"
],
datasets:[
{
data:[
protein,
fat,
carbs
]
}
]
}
});
}