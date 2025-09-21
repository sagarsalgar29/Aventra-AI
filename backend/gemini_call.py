from google import genai

client = genai.Client(api_key="AIzaSyASIcEqnPUmriBRrlZlDqX9wWnLEoaV9jI")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="dwhich trains are available to travel from pune to ooty?",
)

print(response.text)