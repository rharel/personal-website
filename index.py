from flask import Flask, redirect, url_for, render_template, send_from_directory

app = Flask(__name__)


@app.errorhandler(403)
def page_not_found(error):
    return render_template('error/403.html'), 403


@app.errorhandler(404)
def page_not_found(error):
    return render_template('error/404.html'), 404


@app.errorhandler(500)
def page_not_found(error):
    return render_template('error/500.html'), 500


@app.route('/<filename>')
def root(filename):
    if filename.startswith("/"):
        filename = filename[1:]

    return redirect(url_for('static', filename='root/' + filename))


@app.route('/')
def index():
    return redirect(url_for('about'))


@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/projects/')
def projects():
    return render_template('projects/gallery.html')


@app.route('/projects/<name>')
def show_project(name):
    return render_template('projects/%s/index.html' % name)


@app.route('/contact')
def contact():
    return render_template('contact.html')


if __name__ == '__main__':

    app.run(debug=True)
