from flask import Blueprint
bp = Blueprint("listings", __name__)

@bp.route("/listings", methods=["GET", "POST"])
def listings(): ...

@bp.route("/listing/<int:listing_id>")
def listing_detail(listing_id): ...

@bp.route("/alerts/process", methods=["POST"])
def alerts_process(): ...
