// Create an immediately invoked functional expression to wrap our code
(function() {

    // Define our constructor
    this.customSelect = function() {

        // Create global element references
        this.wrap = null;
        this.skin = null;
        this.textArea = null;
        this.arrows = null;
        this.arrowUp = null;
        this.arrowDown = null;
        this.element = null;
        this.elemClass = null;

        // Define option defaults
        var defaults = {
            upArrow: '<i class="up">&#9650;</i>',
            downArrow: '<i class="down">&#9660;</i>',
            variant: '',
            elementClass: 'custom-select'
        };

        // Create options by extending defaults with the passed in arugments
        if (arguments[0] && typeof arguments[0] === "object") {
            this.options = extendDefaults(defaults, arguments[0]);
        }

    }

    // Public Methods

    customSelect.prototype.init = function() {
        
        if(this.options.content.getAttribute('data-loaded') == null){
            buildOut.call(this);
            initializeEvents.call(this);
        }
        else{
            return false;
        }

    }

    // Private Methods

    function buildOut() {

        var content, docFrag, element, selected, selectText;

        this.options.content.className = this.options.content.className + " " + getClass(this.options.elementClass, 'select');
        this.options.content.setAttribute('data-loaded', 'true');

        this.elemClass = this.options.content.className;

        content = this.options.content.outerHTML;
        element = this.options.content;
        selected = element.selectedIndex;
        selectedText = (selected <= 0) ? element.options[0].text : element.options[selected].text;

        // Create a DocumentFragment to build with
        docFrag = document.createDocumentFragment();

        this.wrap = document.createElement("div");
        this.wrap.className = getClass(this.options.elementClass, 'wrap') + " " + this.options.variant;
        this.wrap.innerHTML = content;

        this.skin = document.createElement("div");
        this.skin.className = getClass(this.options.elementClass, 'skin') + ((element.disabled == true) ?  " " + getClass(this.options.elementClass, 'disabled') : "");
        this.skin.setAttribute('aria-hidden', 'true');

        this.textArea = document.createElement("div");
        this.textArea.className = getClass(this.options.elementClass, 'text');
        this.textArea.innerHTML = selectedText;
        this.skin.appendChild(this.textArea);

        this.arrows = document.createElement("div");
        this.arrows.className = getClass(this.options.elementClass, 'arrows');

        this.arrowsUp = document.createElement("div");
        this.arrowsUp.className = getClass(this.options.elementClass, 'arrows-up');
        this.arrowsUp.innerHTML = this.options.upArrow;
        this.arrows.appendChild(this.arrowsUp);

        this.arrowsDown = document.createElement("div");
        this.arrowsDown.className = getClass(this.options.elementClass, 'arrows-down');
        this.arrowsDown.innerHTML = this.options.downArrow;
        this.arrows.appendChild(this.arrowsDown);

        this.skin.appendChild(this.arrows);

        this.wrap.appendChild(this.skin);

        docFrag.appendChild(this.wrap)

        // Append DocumentFragment to body
        this.options.content.parentNode.insertBefore(docFrag, this.options.content)
        this.options.content.parentNode.removeChild(this.options.content);

        this.element = this.wrap.children[0];

    }

    function extendDefaults(source, properties) {
        var property;
        for (property in properties) {
            if (properties.hasOwnProperty(property)) {
                source[property] = properties[property];
            }
        }
        return source;
    }

    var getClass = function(prefix, suffix){
        return prefix + "_" + suffix;
    };

    var changed = function(obj) {
        var selected = obj.element.options.selectedIndex,
            selectedText = obj.element.options[selected].text;

        obj.textArea.innerHTML = selectedText;
    }

    function hasClass(target, className ) {
        return new RegExp('(\\s|^)' + className + '(\\s|$)').test(target.className);
    }

    function initializeEvents() {

        var _this = this;

        this.element.addEventListener('mouseover', function (e) {
            _this.skin.className = _this.skin.className + ' is-hover';
        }, false);

        this.element.addEventListener('mouseout', function (e) {
            _this.skin.className = _this.skin.className.replace(" is-hover", "");
        }, false);

        this.element.addEventListener('change', function (e) {
            changed(_this);
        }, false);

        this.element.addEventListener('mousedown', function (e) {
            _this.skin.className = _this.skin.className.replace(" is-changed", "");
            e.stopPropagation();
        }, false);

        this.element.addEventListener('keyup', function (e) {
            changed(_this);
        }, false);

        this.element.addEventListener('mouseup', function (e) {
            e.stopPropagation();
            if(hasClass(_this.skin, 'is-opened')){
                _this.skin.className = _this.skin.className.replace(" is-opened", "");
            }
            else{
                _this.skin.className = _this.skin.className + ' is-opened';
            }
        }, false);

        this.element.addEventListener('blur', function (e) {
            _this.skin.className = _this.skin.className.replace(" is-focused is-opened", "");
        }, false);

        this.element.addEventListener('focus', function (e) {
            _this.skin.className = _this.skin.className + ' is-focused';
            _this.skin.className = _this.skin.className.replace(" is-changed", "");
        }, false);

        document.addEventListener("focus", function(event) {
            if(event.target != _this.element){
                _this.skin.className = _this.skin.className.replace(" is-focused", "");
            }
        }, true);

        document.addEventListener("click", function (e) {
            for (var element = e.target; element; element = element.parentNode) {
                if (element.className === _this.elemClass) return;
            }
            if(hasClass(_this.skin, 'is-focused')) _this.skin.className = _this.skin.className.replace(" is-focused", "");
        });
    }

}());
