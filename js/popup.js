dojo.provide("uxebu.widget.popup");

dojo.require("dijit.DialogUnderlay");

(function(d){

uxebu.widget.popup = {
		
	duration: 300,
	
	connections: [],
	
	show: function(content){
		this._loadCheck();
		this.setContent(content);
		this._fadeInAnim.play();
	},
	
	hide: function(){
		this._fadeOutAnim.play();
	},
	
	beforeFadeIn: function(){
		d.style(this.domNode, {
			opacity:0,
			display:""
		});
		this.position();
		this.showUnderlay();
	},
	
	beforeFadeOut: function(){
		
	},
	
	hideUnderlay: function(){
		dijit._underlay.hide();
	},

	layout: function(){
		if(this.domNode.style.display != "none"){
			if(dijit._underlay){	// avoid race condition during show()
				dijit._underlay.layout();
			}
			this.position();
		}
	},
	
	onFadeInEnd: function(){
		
	},
	
	onFadeOutEnd: function(){
		this.hideUnderlay();
		d.style(this.domNode, {
			display:"none"
		});
	},
	
	position: function(){
		var node = this.domNode,
			viewport = dijit.getViewport(),
			bb = d._getBorderBox(node),
			l = Math.floor(viewport.l + (viewport.w - bb.w) / 2),
			t = Math.floor(viewport.t + (viewport.h - bb.h) / 2)
		;
		d.style(node,{
			left: l + "px",
			top: t + "px"
		});
	},
	
	setContent: function(content){
		this.contentNode.innerHTML = content;
	},
	
	setupAnimations: function(){
		this._fadeInAnim = d.fadeIn({
			node: this.domNode,
			duration: this.duration,
			beforeBegin: d.hitch(this, 'beforeFadeIn'),
			onEnd: d.hitch(this, 'onFadeInEnd')
		});

		this._fadeOutAnim = d.fadeOut({
			node: this.domNode,
			duration: this.duration,
			beforeBegin: d.hitch(this, 'beforeFadeOut'),
			onEnd: d.hitch(this, 'onFadeOutEnd')
		});
		
	},
	
	setupConnections: function(){
		this.connections.push(d.connect(this.closeNode,'onclick',this,'hide'));
		this.connections.push(d.connect(window, "onscroll", this, "layout"));
		this.connections.push(d.connect(window, "onresize", this, function(){
			// IE gives spurious resize events and can actually get stuck
			// in an infinite loop if we don't ignore them
			var viewport = dijit.getViewport();
			if(!this._oldViewport ||
					viewport.h != this._oldViewport.h ||
					viewport.w != this._oldViewport.w){
				this.layout();
				this._oldViewport = viewport;
			}
		}));
		this.connections.push(d.connect(d.doc.documentElement, "onkeypress", this, "_onKey"));
	},
	
	setupNodes: function(){
		this.domNode = d.create('div',{
			className: 'uxebuPopup'
		},d.body());
		this.closeNode = d.create('div',{
			className: 'uxebuPopup-closeNode',
			innerHTML: '<span>X</span>'
		},this.domNode);
		this.contentNode = d.create('div',{
			className: 'uxebuPopup-contentNode'
		},this.domNode);
	},
	
	showUnderlay: function(){
		var underlay = dijit._underlay;
		if(!underlay){
			underlay = dijit._underlay = new dijit.DialogUnderlay({id: 'uxebuPopupUnderlay'});
		}else{
			underlay.attr({id: 'uxebuPopupUnderlay'});
		}

		if(!dijit._dialogStack){
			dijit._dialogStack = [];
		}
		var zIndex = 948 + dijit._dialogStack.length*2;
		d.style(dijit._underlay.domNode, 'zIndex', zIndex);
		d.style(this.domNode, 'zIndex', zIndex + 1);
		underlay.show();
	},
	
	_loadCheck: function(){
		if(this.loaded){
			return;
		}
		
		this.setupNodes();
		this.setupConnections();
		this.setupAnimations();
		
		this.loaded = true;
	},
	
	_onKey: function(evt){
		if(this.domNode.style.display != "none" && evt.keyCode && evt.keyCode == 27){
			d.stopEvent(evt);
			this.hide();
		}
	}
};
	
})(dojo);
