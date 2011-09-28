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

		var	postDate = dojo.date.locale.parse(value, {datePattern: 'y-M-d H:m:s', selector: 'date'}) || new Date(value),
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
			loader: '<p><img src="img/loader.gif"></p>',
			noResults: '<p>No more results, maybe watch some videos on one of the previous pages, they rock.</p>',
			about: '<div class="mod mod-skin2"><div class="bd"><h2>Hi there,</h2><p>learnjs is a simple Q&A tool by <a href="http://uxebu.com" target="_blank">uxebu</a> based on twitter and vimeo.</p><p>Simply ask a JavaScript question or provide an answer in a one minute, max. five lines of code video.</p><p>If you are interested in making it better or using it in your own environment,<br />clone/fork the <a href="http://github.com/uxebu/learnjs">repository at github</a>, or send us a message via <a href="http://www.twitter.com/uxebu">twitter (@uxebu)</a> or <a href="http://uxebu.com/#contact" target="_blank">our website</a></p><p class="notice">Background image curtesy of <a href="http://www.flickr.com/photos/chicagogeek/3288238069/" target="_blank">ChicagoGeek</a></p><p><a href="http://www.uxebu.com" target="_blank"><img src="img/logoUxebu.png" width="120" height="46" /></a></p><p><a onclick="uxebu.widget.popup.hide();">Close</a></p></div></div>',
			questions: '{% if not questions|length %}<p>Hey, no js questions? Just ask one by sending a tweet to @learnjs</p>{% endif %}{% for q in questions %}<div id-{{ q.id }}"><p>{{ q.text|safe }}</p><p><img src="{{ q.profile_image_url }}" width="25" height="25" /><a href="http://www.twitter.com/{{ q.from_user }}/status/{{ q.id }}" target="blank">{{ q.created_at|ago }}</a> by <strong><a href="http://www.twitter.com/{{ q.from_user }}" target="blank">{{ q.from_user }}</a></strong></p</div>{% endfor %}',
			answers: '{% for a in answers %}<h3 class="answer"><a href="{{ a.video.url }}">{{ a.video.title }}</a></h3><img src="{{ a.video.user_portrait_small }}" /><a href="{{ a.video.user_url }}" target="blank">{{ a.video.upload_date|ago }}</a> by <strong><a href="{{ a.video.user_url }}" target="blank">{{ a.video.user_name }}</a></strong><div class="answer">{{ a.video.html|safe }}</div>{% endfor %}'
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
			dojo.query("#about").onclick(function(e){
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
				pageNo: dojo.query(".pageNo")
			}

			// Connect to search box to auto search on enter
			dojo.query(".search").connect("onkeydown", function(e){
				if (e.keyCode == dojo.keys.ENTER){
					learn.getAnswers();
				}
			});

			learn.getQuestions();
			learn.getAnswers();
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
		getAnswers: function(type, search){
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

			// If search input has a value we make a search is provided we make a search, otherwise list all
			var search = dojo.byId("search").value;
			if (search && search.length > 2){
				// Reset counter on first search
				if (!learn.searchReset){
					learn.config.offset = 1;
					learn.config.limit = 5;
					learn.searchReset = true;
				}
				var url = "http://query.yahooapis.com/v1/public/yql?q=use%20%22http%3A%2F%2Flearnjs.org%2Fyql%2Fvideosearch.xml%22%20as%20videos%3B%20select%20*%20from%20videos%20where%20search%3D%22"+search+"%22%20limit%20"+learn.config.limit+"%20offset%20"+learn.config.offset+"&format=json&_maxage=3600&_rnd=20100802";
			}else{
				// Display alert when search term is only 2 characters long
				if (search && search.length <= 2){
					alert("Search phrase needs to be at least three characters long");
				}
				// Reset counter on first blank lookup
				if (learn.searchReset){
					learn.config.offset = 1;
					learn.config.limit = 5;
				}
				learn.searchReset = false;
				var url = "http://query.yahooapis.com/v1/public/yql?q=use%20%22http%3A%2F%2Flearnjs.org%2Fyql%2Fvideos.xml%22%20as%20videos%3B%20select%20*%20from%20videos%20limit%20"+learn.config.limit+"%20offset%20"+learn.config.offset+"&format=json&_maxage=3600&_rnd=20100803";
			}

			dojo.byId("answers").innerHTML = learn.templates.loaderMargin;
			dojo.io.script.get({
				url: url,
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
