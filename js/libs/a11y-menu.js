var A11yMenu = function(domNode, options){
    // Constructor here
    'use strict';

    var whichTransEvent = function(){
        var t;
        var el = document.createElement('fake');
        var transitions = {
          'transition':'transitionend',
          'OTransition':'oTransitionEnd',
          'MozTransition':'transitionend',
          'WebkitTransition':'webkitTransitionEnd'
        }

        for(t in transitions){
            if( el.style[t] !== undefined ){
                return transitions[t];
            }
        }
    }

    var extend = function ( source, properties ) {
        var property;
        for (property in properties) {
            if (properties.hasOwnProperty(property)) {
                source[property] = properties[property];
            }
        }
        return source;
    };

    //
    // Variables
    //
    var defaults = {
        beforeOpen: function () {},
        beforeClose: function() {},
        tapStop: false,
        nameSpace: "main-menu",
        itemClass: ".js-menu-items",
        activeClass: "is-active",
        openClass: "is-shown",
        animateClass: "is-revealed",
        horizontal: true
    };

    this.node = domNode; 
    this.option = extend(defaults, options);
    this.bndEvt = this.eventHandler.bind(this);
    this.bndClose = this.closeTrans.bind(this);
    this.bndOpen = this.openTrans.bind(this);
    this.transEvt = whichTransEvent();
    this.nodeObj = {
        menuItems: null,
        menuLinks: [],
        activeItem: null,
        activeLink: null,
        subMenus: [],
        activeSubMenu: null,
        subMenuOpen: false,
    };
    this.docActive = null;
};

A11yMenu.prototype.destroy = function () {

    for (var i = 0; i < this.nodeObj.menuItems.length; i++) {
        this.nodeObj.menuItems[i].parentNode.classList.remove(this.option.openClass, this.option.animateClass);
    };

    for (var i = 0; i < this.nodeObj.menuLinks.length; i++) {
        this.nodeObj.menuLinks[i].classList.remove(this.option.activeClass);
    };

    this.nodeObj = {
        menuItems: null,
        menuLinks: [],
        activeItem: null,
        activeLink: null,
        subMenus: [],
        activeSubMenu: null,
        subMenuOpen: false,
        nextIndex: null
    };

    this.docActive = null;
    this.node.removeEventListener("keydown", this.bndEvt, false);
    this.node.classList.remove('is-ready');
};

A11yMenu.prototype.init = function () {
    var nodeObj = this.nodeObj;
    var option = this.option;

    nodeObj.menuItems = [].slice.call(this.node.querySelectorAll(option.itemClass));

    // loop through each menu item, add links to array, add submenus to array
    for (var i = 0, itemLen = nodeObj.menuItems.length; i < itemLen; i++) {
        var tempLink = nodeObj.menuItems[i].querySelector('a[href],button:not([disabled])');

        //push links to global array to be used later
        nodeObj.menuLinks.push(tempLink)

        //if single tab stop is active set tabindex
        if(option.tapStop){
            if(!i) tempLink.tabIndex = 0;
            else tempLink.tabIndex = -1;
        }

        //check if link has submenu
        if(tempLink.hasAttribute('aria-haspopup')){
            var tempSubMenu = document.getElementById(tempLink.getAttribute('aria-controls'));
            nodeObj.subMenus.push(tempSubMenu)
        }
        else{
            nodeObj.subMenus.push(null)
        }

        tempLink.addEventListener("mouseover", this.bndEvt, false);
    };

    // event listeners
    this.node.addEventListener("keydown", this.bndEvt, false);

    this.node.classList.add('is-ready');
};

// which keycodes are allowed
A11yMenu.prototype.allowKey = function(array, key){
    if(array.indexOf(key) === -1){
        return true;
    }
}

// gets all focusable elements of container
A11yMenu.prototype.focusable = function(elem){
    var tempLinks = elem.querySelectorAll('a[href],button:not([disabled])');
    var links = [];

    for (var i = 0; i < tempLinks.length; i++) {
      if(tempLinks[i].offsetHeight !== 0) links.push(tempLinks[i])
    };

    return links;
}

// Generic Event Handler
A11yMenu.prototype.eventHandler = function(event){
    var nodeObj = this.nodeObj;
    var eventType = event.type;
    var key = 'which' in event ? event.which : event.keyCode;
    this.docActive = document.activeElement;
    var inDomElement = this.node.contains(this.docActive);
    var subMenuOpen = nodeObj.subMenuOpen;
    var inMenu = nodeObj.menuLinks.indexOf(this.docActive) !== -1;
    var inSubMenu = (subMenuOpen) ? nodeObj.activeSubMenu.contains(this.docActive) : false;
    var hasSubMenu = this.docActive.hasAttribute('aria-haspopup');

    if(eventType === "keydown"){
        // is a submenu open and escape pressed - close it
        if(subMenuOpen && key === 27) {
            nodeObj.activeLink.focus();
            this.closeSub();
        }

        // when in main menu
        if(inMenu && !this.allowKey([38,40,37,39,32,13,27,9,16,36,35], key)){
            //travel main menu
            this.travelMain(event, key);

            // if has pop up lets open the submenu
            if(hasSubMenu && !subMenuOpen) this.openEvent(event, key);

            // if submenu open and in main menu, jump into submenu
            if(subMenuOpen){
                if(this.allowKey([40,38], key)) return;

                var links = this.focusable(nodeObj.activeSubMenu);
                var link = (key === 38) ? links[links.length-1] : links[0];
                
                link.focus();
                event.preventDefault();
            }
        }
        else if(inSubMenu){
            // travel submenu
            this.travelSub(event, key);
        }
    }

    if(eventType === "mouseover" && subMenuOpen){
        this.closeSub();
    }

};

// helpers for navigating main menu
A11yMenu.prototype.travelMain = function(event, key){
    var nodeObj = this.nodeObj;
    var index = nodeObj.menuLinks.indexOf(this.docActive);
    var lastIndex = nodeObj.menuLinks.length-1;

    // dont pass here unless end, home, left, right; 
    if(this.allowKey([35,36,37,39], key)) return;

    // run if home or end is press
    this.homeEnd(event, nodeObj.menuLinks, key);

    // left key = 37
    if(key === 37) {
        index = (index === 0) ? lastIndex : index-1;
    }
    // right key = 39
    else if(key === 39){
        index = (index === lastIndex) ? 0 : index+1;
    }

    // if left and right set focus
    if(!this.allowKey([37,39], key)) {
        nodeObj.menuLinks[index].focus();

        if(this.option.tapStop){
            for (var i = 0; i < nodeObj.menuLinks.length; i++) {
                nodeObj.menuLinks[i].tabIndex = -1;
            };
            nodeObj.menuLinks[index].tabIndex = 0;
        }
    };

    // close submenu, if next menu item has sub menu open it
    if(nodeObj.subMenuOpen){
        var nextIndex = (nodeObj.subMenus[index] !== null) ? index : undefined;
        this.closeSub(nextIndex);
    }
}

// Close subMenu event
A11yMenu.prototype.closeSub = function(nextIndex){
    var nodeObj = this.nodeObj;
    var option = this.option;

    nodeObj.activeLink.classList.remove(option.activeClass);
    nodeObj.activeLink.setAttribute('aria-expanded', false);
    option.beforeClose();
    nodeObj.activeItem.classList.remove(option.animateClass);
    nodeObj.nextIndex = nextIndex;
    nodeObj.activeSubMenu.addEventListener(this.transEvt, this.bndClose, false);
}

// Close subMenu transition event
A11yMenu.prototype.closeTrans = function(event){
    if(event.propertyName === "opacity"){
        var nodeObj = this.nodeObj;
        var option = this.option;

        nodeObj.activeItem.classList.remove(option.openClass);
        nodeObj.activeSubMenu.removeEventListener(this.transEvt, this.bndClose, false);
        nodeObj.activeSubMenu = nodeObj.activeItem = nodeObj.activeLink = null;
        nodeObj.subMenuOpen = false;
        document.documentElement.classList.remove(option.nameSpace + "-open");

        if(nodeObj.nextIndex !== undefined){
            this.openSub(nodeObj.nextIndex);
        }
    }
}


// A11yMenu.prototype.quickCloseOpen = function(index, link){
//     if(this.activeLink === null) return;
    
//     //close stuff
//     this.wrapper.classList.add('quick-show');
//     this.activeLink.classList.remove(this.activeClass);
//     this.activeLink.setAttribute('aria-expanded', false);
//     this.activeItem.classList.remove(this.animateClass);
//     this.activeItem.classList.remove(this.openClass);

//     // open stuff
//     this.openSubMenuItem = this.subMenuItems[index];
//     this.activeLink = this.mainLinks[index]; 
//     this.activeItem = this.mainItems[index];
//     this.activeLink.classList.add(this.activeClass);
//     this.activeLink.setAttribute('aria-expanded', true);
//     this.activeItem.classList.add(this.openClass);
//     this.settings.beforeQuickOpen();
//     this.activeItem.classList.add(this.animateClass);
//     var height = outerHeight(this.openSubMenuItem);
//     this.openSubMenuItem.style.clip = 'rect(' + height + 'px, 9999px, 9999px, 0)';
//     this.wrapper.classList.remove('quick-show');
// }


// Open menu event
A11yMenu.prototype.openEvent = function(event, key){
    var nodeObj = this.nodeObj;
    var index = nodeObj.menuLinks.indexOf(this.docActive);

    //if(this.allowKey([40,32,13,1,38], key) || event.target.classList.contains('is-active')) return; 
    if(event.target.classList.contains('is-active')) return; 

    if(this.option.horizontal){
        if(this.allowKey([40,32,13,1,38], key)) return

        if(key === 38) {
            this.openSub(index, false);
        }
        else {
            this.openSub(index, true);
        }
    }
    else{
        if(this.allowKey([37,32,13,1,39], key)) return

        if(key === 39) {
            this.openSub(index, true);
        }
        else if(key === 37){
            this.openSub(index, false);
        }
    }
    
    event.preventDefault();
}

// Opening SubMenu - sets focus to first or last if 'link' arguement is true or false
A11yMenu.prototype.openSub = function(index, link){
    var nodeObj = this.nodeObj;
    var option = this.option;
    var _this = this;
    var timer;   

    nodeObj.activeSubMenu = nodeObj.subMenus[index];
    nodeObj.activeLink = nodeObj.menuLinks[index]; 
    nodeObj.activeItem = nodeObj.menuItems[index];
    nodeObj.activeLink.classList.add(option.activeClass);
    nodeObj.activeLink.setAttribute('aria-expanded', true);
    nodeObj.activeItem.classList.add(option.openClass);
    option.beforeOpen();
    timer = setTimeout(function(){
        nodeObj.activeSubMenu.addEventListener(_this.transEvt, _this.bndOpen, false);
        nodeObj.activeItem.classList.add(option.animateClass);
        nodeObj.subMenuOpen = true;
        clearTimeout(timer);
    }, 10);

    var submenuLinks = this.focusable(nodeObj.activeSubMenu);

    if(link !== undefined){
        var index = (link === true) ? 0 : submenuLinks.length-1;
        submenuLinks[index].focus();
    }
    
}

// Open subMenu transition event
A11yMenu.prototype.openTrans = function(event){
    if(event.propertyName === "opacity"){
        document.documentElement.classList.add(this.option.nameSpace + "-open");
        this.nodeObj.activeSubMenu.removeEventListener(this.transEvt, this.bndOpen, false);
    }
}

// helpers for navigating sub menu
A11yMenu.prototype.travelSub = function(event, key){
    if(this.allowKey([37,38,39,40,9,35,36], key)) return;

    var nodeObj = this.nodeObj;
    var option = this.option;
    var links = this.focusable(nodeObj.activeSubMenu);
    var linksLen = links.length-1;
    var _this = this;

    if(option.tapStop){
        for (var i = 0; i < links.length; i++) {
            links[i].tabIndex = -1;
        };

        links[0].tabIndex = 0;
    }

    this.homeEnd(event, links, key);

    // Up and Down keypress handler
    var upDown = function(){
        if(_this.allowKey([38,40], key)) return;

        var index = links.indexOf(_this.docActive);

        // down key = 40
        if(key === 40) {
            index = (index === linksLen) ? 0 : index+1;
        }
        // up key = 38
        else{
            index = (index === 0) ? linksLen : index-1;
        }
        
        links[index].focus();
        event.preventDefault();
    }();

    // Left and Right keypress handler
    var leftRight = function(){
        if(_this.allowKey([37,39], key)) return;

        var index = nodeObj.subMenus.indexOf(nodeObj.activeSubMenu);
        var subMenuLen = nodeObj.subMenus.length-1;

        // left key = 37
        if(key === 37) {
            index = (index === 0) ? subMenuLen : index-1;
        }
        // right key = 39
        else{
            index = (index === subMenuLen) ? 0 : index+1;
        }

        nodeObj.menuLinks[index].focus();

        if(_this.option.tapStop){
            for (var i = 0; i < nodeObj.menuLinks.length; i++) {
                nodeObj.menuLinks[i].tabIndex = -1;
            };
            nodeObj.menuLinks[index].tabIndex = 0;
        }

        var nextIndex = (nodeObj.subMenus[index] !== null) ? index : undefined;
        _this.closeSub(nextIndex);

        event.preventDefault();
    }();

    // tab keypress handler
    var tab = function(){
        if (key !== 9 || option.tapStop) return;
            
        if (event.shiftKey && _this.docActive === links[0]) {
            links[linksLen].focus();
            event.preventDefault();
        } else if (!event.shiftKey && _this.docActive === links[linksLen]) {
            links[0].focus();
            event.preventDefault();
        }
    }();
}

A11yMenu.prototype.homeEnd = function(event, links, key){
    if(this.allowKey([35,36], key)) return 

    var index = (key === 36) ? 0 : links.length-1;
    links[index].focus();

    event.preventDefault();
};