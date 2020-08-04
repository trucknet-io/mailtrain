const hbs = require('hbs');

module.exports = {
    /**
    {{#switch state}}
        {{#case "page1" "page2"}}page 1 or 2{{/case}}
        {{#case "page3"}}page3{{/case}}
        {{#case "page4"}}page4{{/case}}
        {{#case "page5"}}
            {{#switch s}}
                {{#case "3"}}s = 3{{/case}}
                {{#case "2"}}s = 2{{/case}}
                {{#case "1"}}s = 1{{/case}}
                {{#default}}unknown{{/default}}
            {{/switch}}
        {{/case}}
        {{#default}}page0{{/default}}
    {{/switch}}
    */
    registerSwitchCase: () => {
        hbs.__switch_stack__ = [];

        hbs.registerHelper('switch', function(value, options) {
            hbs.__switch_stack__.push({
                switch_match: false,
                switch_value: value
            });
            const html = options.fn(this);
            hbs.__switch_stack__.pop();
            return html;
        });
        hbs.registerHelper('case', function(...args) {
            const options = args.pop();
            const caseValues = args;
            const stack = hbs.__switch_stack__[hbs.__switch_stack__.length - 1];

            if (
                stack.switch_match ||
                caseValues.indexOf(stack.switch_value) === -1
            ) {
                return '';
            } else {
                stack.switch_match = true;
                return options.fn(this);
            }
        });
        hbs.registerHelper('default', function(options) {
            const stack = hbs.__switch_stack__[hbs.__switch_stack__.length - 1];
            if (!stack.switch_match) {
                return options.fn(this);
            }
        });
    },

    /**
    {{#if (or 
            (eq section1 "foo")
            (ne section2 "bar") )}}
        .. content
    {{/if}}
    */
    registerIfConditions: () => {
        hbs.registerHelper({
            eq: function(v1, v2) {
                return v1 === v2;
            },
            ne: function(v1, v2) {
                return v1 !== v2;
            },
            lt: function(v1, v2) {
                return v1 < v2;
            },
            gt: function(v1, v2) {
                return v1 > v2;
            },
            lte: function(v1, v2) {
                return v1 <= v2;
            },
            gte: function(v1, v2) {
                return v1 >= v2;
            },
            and: function(...args) {
                return args.every(Boolean);
            },
            or: function(...args) {
                return args.some(Boolean);
            }
        });
    },
    /**
     * https://stackoverflow.com/questions/42245693/handlebars-js-replacing-portion-of-string
     * {{#replace "&amp;" "and"}}{{title}}{{/replace}}
     */
    registerReplace: () => {
        hbs.registerHelper('replace', function( find, replace, options) {
            var string = options.fn(this);
            return string.replace( find, replace );
        });
    }
};
