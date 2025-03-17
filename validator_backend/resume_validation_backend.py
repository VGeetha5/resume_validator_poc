import google.generativeai as genai
from flask import Flask, request, jsonify
import PyPDF2
import os
from flask_cors import CORS, cross_origin
app = Flask(__name__)
cors = CORS(app) # allow CORS for all domains on all routes.
app.config['CORS_HEADERS'] = 'Content-Type'

def extract_text_from_pdf(pdf_file):
    """Extracts text from a PDF file object."""
    try:
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page_num in range(len(reader.pages)):
            text += reader.pages[page_num].extract_text() or ""
        return text.strip()
    except Exception as e:
        return f"Error extracting PDF: {e}"

def validate_resume(resume_content, job_description):
    """Validates a resume against a job description using Gemini."""
    genai.configure(api_key="AIzaSyCneiYCmB5fSyWF5fd7SN4q4VAOWBEgRwA") #api key will be deleted in few days
    model = genai.GenerativeModel('gemini-2.0-flash')

    prompt = f"""
    **Job Description:**
    {job_description}

    **Resume:**
    {resume_content}

    **Instructions:**

    1.  Rate the resume's suitability for the job description on a scale of 1 to 10, where 1 is very poor and 10 is excellent.
    2.  Provide specific suggestions on how the resume can be improved to better match the job description. Focus on skills, experience, and formatting.
    3.  Explain your rating.
    4.  Include a Missing set of skills based on the job description.
    5.  if the resume content is not a valid resume data extract then respond back with a rating of 0 and explanation as please upload a valid resume to evaluate. 

    Present the response in the below output format.
    **Output Format:**

    Rating: [Rating (1-10)]
    Explanation: [Explanation of Rating]
    
    Suggestions:
    - [Suggestion 1]
    - [Suggestion 2]

    Missing_Skills: [list of skills missing based on the job description]
    """

    try:
        response = model.generate_content(prompt)
        response_formatted = response.text
        response_formatted = response_formatted.replace("*","")
        print(response_formatted)
       
        return {
            "rating": extract_rating(response_formatted),
            "explanation": extract_explanation(response_formatted),
            "suggestions": extract_suggestions(response_formatted),
            "raw_response": response_formatted,
        }
    except Exception as e:
        return {"error": str(e)}
    

def extract_rating(text):
    """Extracts the rating from the response text."""
    try:
        lines = text.split('\n')
        for line in lines:
            if "Rating:" in line:
                return line.split("Rating:")[1].strip()
        print("Rating not found")
        return "Rating not found"
    except:
        return "Rating not found"

def extract_explanation(text):
    """Extracts the explanation from the response text."""
    try:
        lines = text.split('\n')
        explanation_start = False
        explanation = ""
        for line in lines:
            if "Explanation:" in line:
                explanation_start = True
                explanation += line.split("Explanation:")[1].strip() + "\n"
            elif explanation_start and "Suggestions:" not in line and "Rating:" not in line:
                explanation += line + "\n"
        return explanation.strip()
    except:
        return "Explanation not found"

def extract_suggestions(text):
    """Extracts the suggestions from the response text."""
    try:
        lines = text.split('\n')
        suggestions_start = False
        suggestions = []
        for line in lines:
            if "Suggestions:" in line:
                suggestions_start = True
            elif suggestions_start and line.startswith("-") and "Missing_Skills:" not in line:
                suggestions.append(line.strip("-").strip())
            elif "Missing_Skills:" in line:
                return suggestions
        return suggestions
    except:
        return []

@app.route('/validate_resume', methods=['POST'])
@cross_origin()
def validate_resume_endpoint():
    """Endpoint to validate a resume based on job description."""
    try:
        if 'pdf_path' not in request.files:
            return jsonify({"error": "No PDF file provided"}), 400

        pdf_file = request.files['pdf_path']

        if pdf_file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        job_description = request.form.get('job_description')
        # print(job_description)
        # api_key = request.form.get('api_key')

        if not job_description:
            return jsonify({"error": "Missing job_description"}), 400

        resume_content = extract_text_from_pdf(pdf_file)
        if "Error extracting PDF" in resume_content:
            return jsonify({"error": resume_content}), 400

        result = validate_resume(resume_content, job_description)
        resp = jsonify(result)
        print(result)
        return resp
    

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)