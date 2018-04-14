from flask import Flask, redirect, url_for, render_template
from flask_htmlmin import HTMLMIN as initialize_htmlmin
from jinja2.exceptions import TemplateNotFound


##################
# Initialization #
##################

app = Flask(__name__)
app.config["DEBUG"] = __name__ == "__main__"
app.config["MINIFY_PAGE"] = True
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 604800

initialize_htmlmin(app)

#############
# Utilities #
#############

def try_to_render_template(url):
    try:
        return render_template(url)
    except TemplateNotFound as error:
        return page_not_found(error)
    except Exception as other_exception:
        raise other_exception

##################
# Error Handlers #
##################

@app.errorhandler(403)
def page_access_forbidden(error):
    return render_template("errors/403.html"), 403

@app.errorhandler(404)
def page_not_found(error):
    return render_template("errors/404.html"), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template("errors/500.html"), 500

if app.debug:
    @app.route("/error/<code>")
    def debug_error(code):
        return render_template("errors/{code}.html".format(code=code))

###############
# Main routes #
###############

# Root

@app.route("/")
def index():
    return about()

@app.route("/favicon.ico")
def favicon():
    return redirect("static/common/image/favicon_16.ico")

# About

@app.route("/about")
def about():
    return render_template("about/about.html")

# Contact

@app.route("/contact")
def contact():
    return render_template("contact/contact.html")

############
# Projects #
############

@app.route("/projects/")
def projects():
    return render_template("projects/gallery/gallery.html")

@app.route("/projects/<project>")
def show_project(project):
    return try_to_render_template("projects/{project}/index.html".format(project=project))

@app.route("/projects/<project>/<page>")
def show_project_page(project, page):
    return try_to_render_template("projects/{project}/pages/{page}.html".format(
        project=project,
        page=page
    ))

############
# Research #
############

@app.route("/research/")
def research():
    return redirect(url_for("research_project", project="virtual-dialogue"))

@app.route("/research/<project>")
def research_project(project):
    return try_to_render_template("research/{project}/index.html".format(project=project))

#######
# Run #
#######

if app.debug: app.run()
