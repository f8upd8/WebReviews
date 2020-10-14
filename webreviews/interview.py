from flask import (
    Blueprint, render_template, request, session, url_for, json, Markup
)

from .db import get_db

import time

bp = Blueprint('inverview', __name__, url_prefix='/interview')

#@bp.route('<int:id>/get-questions', methods = ['GET'])
def get_questions(id):
    db = get_db()
    resp = db.execute("SELECT body FROM question WHERE interview_id=?", (id,))
    questions = dict()
    i = 0
    for row in resp:
        questions[str(i+1)] = row[0].strip('\n')
        i += 1
    return questions

@bp.route('<int:id>/submit', methods = ['POST'])
def submit_interview(id):
    db = get_db()
    print(request.form)
    videoFile = request.files['file']
    timeStampsJson = request.form['timeStamps']
    videoBlob = videoFile.read()
    print(type(videoBlob))
    print("REQUESTED 2 ")
    db.execute("INSERT into video(recording, key_timestamps, interview_id) VALUES (?, ?, ?)", (videoBlob, timeStampsJson, id))
    db.commit()
    with open(str(time.time()) + '.webm', 'wb+') as destination:
        destination.write(videoBlob)    
    return {"status": "success"}

@bp.route('/<int:id>', methods = ['GET'])
def interview_page(id):
    questions_json = json.dumps(get_questions(id), ensure_ascii=False)
    return render_template('interview.html', json = Markup(questions_json))

# @bp.route('<int:id>/submit', methods = ['POST'])
# def submit_interview(id):
#     #TODO
#     raise NotImplementedError