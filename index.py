from flask import Flask, redirect, url_for, render_template

app = Flask(__name__)


@app.errorhandler(404)
def page_not_found(error):
	return render_template('error_404.html'), 404

	
@app.route('/')
def index():
    return redirect(url_for('about'))
	
@app.route('/about')
def about():
	return render_template('about.html')

@app.route('/projects/')
def projects():
	return 'Projects'

@app.route('/contact')
def contact():
	return 'Contact'

	
if __name__ == '__main__':
	
	app.run(debug = True)
