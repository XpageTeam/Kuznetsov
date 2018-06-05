$(e => {

	if (is.ie())
		$("picture").each((i, el) => {
			let $this = $(el),
				$mainSource = $this.find("source[data-main]").length 
							  ? $this.find("source[data-main]")
							  : $this.find("source:eq(0)");

			if (!$mainSource.length)
				return

			let imgSrc = $mainSource.attr("srcset");

			$this.find("img")[0].src = imgSrc;
		});

	if (!is.mobile()){
		$('#content').fullpage({
			//Навигация
			menu: '#menu',
			lockAnchors: false,
			anchors:['page-1', 'page-2', "page-3", "page-4", "page-5"],
			navigation: false,
			navigationPosition: 'right',
			navigationTooltips: ['firstSlide', 'secondSlide'],
			showActiveTooltip: false,
			slidesNavigation: false,
			slidesNavPosition: 'bottom',

			//Скроллинг
			css3: true,
			scrollingSpeed: 700,
			autoScrolling: true,
			fitToSection: true,
			fitToSectionDelay: 1000,
			scrollBar: false,
			easing: 'easeInOutCubic',
			easingcss3: 'ease',
			loopBottom: false,
			loopTop: false,
			loopHorizontal: true,
			continuousVertical: false,
			continuousHorizontal: false,
			scrollHorizontally: false,
			interlockedSlides: false,
			dragAndMove: false,
			offsetSections: false,
			resetSliders: false,
			fadingEffect: false,
			normalScrollElements: '#element1, .element2',
			scrollOverflow: false,
			scrollOverflowReset: false,
			scrollOverflowOptions: null,
			touchSensitivity: 15,
			normalScrollElementTouchThreshold: 5,
			bigSectionsDestination: null,

			//Доступ
			keyboardScrolling: true,
			animateAnchor: true,
			recordHistory: true,

			//Дизайн
			controlArrows: true,
			verticalCentered: true,
			sectionsColor : ['#ccc', '#fff'],
			paddingTop: $(".head").innerHeight() + "px",
			paddingBottom: '0',
			fixedElements: '.head, .years',
			responsiveWidth: 600,
			responsiveHeight: 0,
			responsiveSlides: false,
			parallax: false,
			parallaxOptions: {type: 'reveal', percentage: 62, property: 'translate'},

			//Настроить селекторы
			sectionSelector: '.page',
			slideSelector: '.slide',

			lazyLoading: true,

			//события
			onLeave: function(index, nextIndex, direction){},
			afterLoad: function(anchorLink, index){},
			afterRender: function(){},
			afterResize: function(){},
			afterResponsive: function(isResponsive){},
			afterSlideLoad: function(anchorLink, index, slideAnchor, slideIndex){},
			onSlideLeave: function(anchorLink, index, slideIndex, direction, nextSlideIndex){}
		});

		$(".page-link--top").click(e => {
			$.fn.fullpage.moveSectionUp();
		});

		$(".page-link--bot").click(e => {
			$.fn.fullpage.moveSectionDown();
		});

		$(".page__text .text-page p").each((i, el) => {
			new stringEffect({
				selector: $(el),
			})
		});
	}
});


class stringEffect{
	set settings(settings){

		const defaultSettings = {
			options: {
				timeStep: .12,
				timeOffset: 0,
				transformStep: 20,
				transformStepOffset: 0,
			}, 
			beforeStart(){

			}, 
			afterFinish(){

			},
		};

		this._settings = $.extend( true, {}, defaultSettings, settings);
	}
	get settings(){
		return this._settings;
	}
	set $el(selector){
		this._el = selector
	}
	get $el(){
		return $(this._el)
	}

	afterFinish(){
		// console.log(this.settings.afterFinish);
		this.settings.afterFinish(this.$el, this.stringCounter, this.settings.options)
	}

	beforeStart(){
		this.settings.beforeStart(this.$el, this.stringCounter, this.settings.options)
	}


	constructor(settings = {}){
		this.settings = settings;

		this.$el = this.settings.selector;

		this.init()
	}

	init(){
		this.wrapWords();
		this.createStrings();
		this.afterFinish();

		this.whatch();
	}

	rebuild(){
		this.destroyStrings();
		this.createStrings();
	}

	wrapWords(){
		this.beforeStart();

		let textArr = this.$el.html().split(/\s+(?![^<>]*>)/g);

		this.$el.html("");

		for (let i in textArr)
			this.$el.append(" <span>"+textArr[i]+"</span>");

	}

	destroyStrings(){
		this.$el.children("div").children("span").unwrap();
	}

	createStrings(){
		let $text = this.$el.children("span"),
			stringsDesc = [];

		$text.each((i, el) => {
			let $this = $(el);

			// console.log(parseInt($this.position().top);

			stringsDesc.push({
				id: i,
				top: parseInt($this.position().top),
			});
		});

		this.wrapStrings(stringsDesc);
	}

	wrapStrings(stringsDesc = []){
		this.stringCounter = 0;

		let {
			timeStep: delay, 
			timeOffset: tmOffset, 
			transformStep: transStep,
			transformStepOffset: transStepOffset,
		} = this.settings.options;

		for (let i in stringsDesc){


			let word = stringsDesc[i],
				time = tmOffset + this.stringCounter * delay,
				transform = transStepOffset + this.stringCounter * transStep;

			if (!this.$el.find(".string--"+word.top).length){
				this.$el.append("<div class=\"string string--"+word.top+"\">\
					 <span>"
						+this.$el.children("span:eq("+word.id+")").html()+
					"</span>\
				</div>");

				this.stringCounter++;

				this.$el.find(".string--"+word.top).css({
					"transition-delay": time+"s",
					transform: "translate3d(0, "+transform+"%, 0)"
				});
			}else
				this.$el.find(".string--"+word.top)
					.append(" <span>"
						+this.$el.children("span:eq("+word.id+")").html()+
					"</span>");
		}

		this.$el.children("span").remove();
	}


	whatch(){
		$(window).on("resize", e => {
			clearTimeout(this.updateTimeout);

			this.updateTimeout = setTimeout(e => {
				this.rebuild();
			}, 100)
		});
	}
}

$(window).on("load scroll", e => {
	if (window.scrollY >= 190)
		$(".head").addClass("js__scroll")
	else
		$(".head").removeClass("js__scroll")
});