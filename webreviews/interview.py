bp = Blueprint('inverview', __name__, url_prefix='/inverview')

@bp.route('/<int:id>/get-questions', methods = ('GET'))
def retreiveQuestions(id):
    #TODO