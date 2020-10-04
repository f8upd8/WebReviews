from flask import (
    Blueprint, render_template, request, session, url_for, json, Markup
)

from .db import get_db


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

@bp.route('/<int:id>', methods = ['GET'])
def interview_page(id):
    questions_json = json.dumps(get_questions(id), ensure_ascii=False)
    return render_template('interview.html', json = Markup(questions_json))

# @bp.route('<int:id>/submit', methods = ['POST'])
# def submit_interview(id):
#     #TODO
#     raise NotImplementedError