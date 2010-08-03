dojo.require("dojo.io.script");
dojo.require("dojox.dtl.dom");

dojo.require("dojox.dtl.tag.loader");
dojo.require("dojox.dtl.tag.logic");
dojo.require("dojox.dtl.tag.loop");
dojo.require("dojox.dtl.filter.lists");
dojo.require("dojox.dtl.tag.logic");
dojo.require("dojox.dtl.filter.dates");
dojo.require("dojox.dtl.utils.date");
dojo.require("dojox.dtl.filter.strings");
dojo.require("dojox.dtl.filter.htmlstrings");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

// Twitter date filter
dojo.provide("uxebu.dtl.filter");
dojo.require("dojo.date.locale");

uxebu.dtl.filter = {
	ago: function(value, arg){
		// summary:
		//		Simple filter for twitter style display of timestamp

		var	postDate = new Date(value),
			today = new Date(),
			yesterday = dojo.date.add(today, "day", -1),
			postStr;

		yesterday.setHours(23);
		yesterday.setMinutes(59);
		yesterday.setSeconds(59);
		if (postDate <= yesterday){
			postStr = dojo.date.locale.format(postDate);
		}else{
			var diff = dojo.date.difference(postDate, today, "minute"),
				diffObj;

			if (diff > 59){
				diff = Math.round(diff/60);
				diffObj = {
					diff: "about " + diff,
					unit: diff > 1 ? "hours" : "hour"
				};
			}else if (diff > 0){
				diffObj = {
					diff: diff,
					unit: diff > 1 ? "minutes" : "minute"
				};
			}else{
				diffObj = {
					diff: "",
					unit: "just a moment"
				};
			}
			postStr = diffObj.diff + " " + diffObj.unit + " ago";
		}
		return postStr;
	}
}

dojo.ready(function(){
	dojox.dtl.register.filters("uxebu.dtl", {"filter": ["ago"]});

	dojo.provide("learn");
	learn = {
		templates: {
			loader: '<div class="line firstLine lastLine {{ marginRight }} marginBottom"><div class="unit lastUnit"><div class="mod pane paneContent"><div class="bd"><div class="loader alignCenter marginTop"><img src="img/loader.gif" /></div></div></div></div></div>',
			noResults: '<div class="line firstLine lastLine marginRight marginBottom"><div class="unit lastUnit"><div class="mod pane paneContent"><div class="bd alignCenter">No more results, maybe watch some videos on one of the previous pages, they rock.</div></div></div></div>',
			about: '<div class="pane"><div class="bd"><div class="marginBottom"><h1 class="marginBottom">Hi there,</h1>learnjs is a simple Q&A tool by <a href="http://uxebu.com" target="_blank">uxebu</a> based on twitter and vimeo.<br />Simply ask a JavaScript question or provide an answer in a one minute, max. five lines of code video.<br /><br />If you are interested in using our Q&A software in your own environment,<br />contact us via <a href="http://www.twitter.com/uxebu">twitter (@uxebu)</a> or <a href="http://uxebu.com/contact" target="_blank">our website</a><div class="ccNotice">Background image curtesy of <a href="http://www.flickr.com/photos/chicagogeek/3288238069/" target="_blank">ChicagoGeek</a></div><div class="alignCenter marginTop"><a href="http://www.uxebu.com" target="_blank"><img src="img/logoUxebu.png" width="120" height="46" /></a></div></div><div class="alignCenter"><button class="button" onclick="uxebu.widget.popup.hide();">Close</button></div></div></div>',
			questions: '{% if not questions|length %}<div class="line firstLine"><div class="unit lastUnit"><div class="mod pane paneContent"><div class="bd">Hey, no js questions? Just ask one by sending a tweet to @learnjs</div></div></div></div>{% endif %}{% for q in questions %}<div class="line{% if forloop.first %} firstLine{% endif %} id-{{ q.id }}"><div class="unit lastUnit"><div class="mod pane paneContent"><div class="bd"><h3>{{ q.text|safe }}</h3><img src="{{ q.profile_image_url }}" width="25" height="25" /><a href="http://www.twitter.com/{{ q.from_user }}/status/{{ q.id }}" target="blank">{{ q.created_at|ago }}</a> by <strong><a href="http://www.twitter.com/{{ q.from_user }}" target="blank">{{ q.from_user }}</a></strong></div></div></div></div>{% endfor %}<div class="line firstLine lastLine"><div class="unit lastUnit"><div class="mod pane paneContent"><div class="bd"><div class="alignCenter"><button class="button" onclick="learn.getQuestions();">Reload</button></div></div></div></div></div>',
			answers: '{% for a in answers %}<div class="list marginBottom"><div class="line firstLine lastLine marginRight"><div class="unit lastUnit"><div class="mod pane paneContent"><div class="bd"><h3 class="answer">{{ a.video.title }}</h3><img src="{{ a.video.user_portrait_small }}" /><a href="{{ a.video.user_url }}" target="blank">{{ a.video.upload_date|ago }}</a> by <strong><a href="{{ a.video.user_url }}" target="blank">{{ a.video.user_name }}</a></strong><div class="answer">{{ a.video.html|safe }}</div></div></div></div></div></div>{% endfor %}',
			questionPostConfirm: '<div class="pane"><div class="bd"><div class="marginBottom">Thank you, it might take a few seconds (up to a minute in bad twitter times) until your question has reached the wise ninjas of the interpipes.<br />If the question doesn\'t show up straight away, just press the reload button a few times.</div><div class="alignCenter"><button class="button" onclick="uxebu.widget.popup.hide(); learn.getQuestions();">Close</button></div></div></div>',
		},
		config: {
			limit: 5,
			offset: 1
		},
		currentTab: 0,
		init: function(){
			// summary:
			//		Initializes learnjs

			// Setting up page navigation
			dojo.query(".menu > .about").onclick(function(e){
				dojo.stopEvent(e);
				uxebu.widget.popup.show(learn.templates.about);
			});

			// Parse margin and nomargin loader
			var loaderTempl = new dojox.dtl.Template(learn.templates.loader);
			learn.templates.loaderMargin = loaderTempl.render(new dojox.dtl.Context({marginRight: "marginRight"}));
			learn.templates.loaderNoMargin = loaderTempl.render(new dojox.dtl.Context({marginRight: ""}));

			learn.nodeLists = {
				buttonPrev: dojo.query(".button.previous"),
				buttonNext: dojo.query(".button.next"),
				pageNo: dojo.query(".pageNo"),
				tabs: dojo.query(".tab"),
				tabContents: dojo.query(".tabContents")
			}

			// Set up tabs
			learn.nodeLists.tabs.connect("onclick", function(e){
				var node = e.target;
				while (!dojo.hasClass(node, "tab")){
					node = node.parentNode;
				}

				var index = dojo.indexOf(learn.nodeLists.tabs, node);
				if (index != learn.currentTab){
					learn.skip(index);
				}
			});

			learn.getQuestions();
			learn.getAnswers();
		},
		skip: function(index){
			// summary:
			//		Handles skipping to a different tab.

			dojo.removeClass(learn.nodeLists.tabs[learn.currentTab], "active");
			dojo.addClass(learn.nodeLists.tabContents[learn.currentTab], "displayNone");
			learn.currentTab = index;
			dojo.removeClass(learn.nodeLists.tabContents[learn.currentTab], "displayNone");
			dojo.addClass(learn.nodeLists.tabs[learn.currentTab], "active");
		},
		getQuestions: function(){
			// summary:
			//		Gets latest tweets.

			dojo.byId("questions").innerHTML = learn.templates.loaderNoMargin;
			dojo.io.script.get({
				url: "http://search.twitter.com/search.json?q=learnjs", // With questionmark +%3F
				jsonp: "callback",
				load: function(data){
					if (data.results){
						learn.renderQuestions(data.results);
					}
				}
			});
		},
		renderQuestions: function(questions){
			// summary:
			//		Renders questions and twitter feed in general.

			var 	tmpl = new dojox.dtl.Template(learn.templates.questions),
				node = dojo.byId("questions");

			node.innerHTML = ""; // FIXME?!!!
			var context = new dojox.dtl.Context({questions: questions});
			node.appendChild(dojo._toDom(tmpl.render(context)));
		},
		getAnswers: function(type){
			// summary:
			//		Gets new answers from yql table.

			switch (type){
				case 'next':
					learn.config.offset += learn.config.limit;
					break;
				case 'prev':
					if (learn.config.offset > 1){
						learn.config.offset -= learn.config.limit;
					}
					break;
			}

			dojo.byId("answers").innerHTML = learn.templates.loaderMargin;
			dojo.io.script.get({
				url: "http://query.yahooapis.com/v1/public/yql?q=use%20%22http%3A%2F%2Flearnjs.org%2Fyql%2Fvideos.xml%3F1es%22%20as%20videos%3B%20select%20*%20from%20videos%20limit%20"+learn.config.limit+"%20offset%20"+learn.config.offset+"&format=json&_maxage=3600&_rnd=20100803",
				jsonp: "callback",
				load: function(data){
					// YQL has a weird bug where it resurns an object when resultset is one.
					if (data.query.count == 1 && data.query.results.videos.video){
						var video = data.query.results.videos.video;
						data.query.results.videos = [{ video: data.query.results.videos.video }];
					}
					if (data.query.count == 0){
						learn.nodeLists.buttonNext.attr("disabled", true);
						if (learn.config.offset > 1){
							learn.nodeLists.buttonPrev.attr("disabled", false);
						}

						dojo.byId("answers").innerHTML = learn.templates.noResults;
					}else{
						// Disable next button if resultset < limit
						learn.nodeLists.buttonNext.attr("disabled", data.query.count < learn.config.limit);
						learn.nodeLists.buttonPrev.attr("disabled", !(learn.config.offset > 1));

						learn.renderAnswers(data.query.results.videos);
					}

					learn.nodeLists.pageNo.attr("innerHTML", (learn.config.offset+learn.config.limit-1)/learn.config.limit)
				}
			});
		},
		renderAnswers: function(answers){
			// summary:
			//		Renders available video answers from yql table.

			var	tmpl = new dojox.dtl.Template(learn.templates.answers),
				node = dojo.byId("answers");

			node.innerHTML = ""; // FIXME?!!!

			var context = new dojox.dtl.Context({
				answers: answers
			});
			node.appendChild(dojo._toDom(tmpl.render(context)));
		}
	}

	learn.init();
});