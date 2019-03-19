'use strict';

let mailer = require('./mailer');
let settings = require('./models/settings');
let templates = require('./models/templates');

module.exports = createTemplateSender;

const MAX_EMAILS = 100;

function createTemplateSender(senderOptions) {
    senderOptions = senderOptions || {};
    if (!senderOptions.templateId) {
        throw new Error('Cannot create template sender without templateId');
    }

    return (mailOptions, callback) => {
        loadDeps(senderOptions, (err, deps) => {
            if (err) {
                return callback(err);
            }
            const sendMail = sendMailFactory(deps);
            sendMail(mailOptions, callback);
        });
    };
}

function sendMailFactory(deps) {
    const { configItems, template, transport } = deps;
    return (options, callback) => {
        try {
            validateMailOptions(options);
        } catch (e) {
            return callback(e);
        }

        transport.sendMail(
            {
                from: { address: configItems.adminEmail },
                to: options.EMAILS,
                subject: options.SUBJECT,
                html: template.html,
                text: template.text
                // TODO: data
            },
            callback
        );
    };
}

function loadDeps(options, callback) {
    const { templateId } = options;
    let errSent = false;
    let deps = {};

    mailer.getMailer((err, transport) => {
        if (err) {
            return returnError(err);
        }
        deps.transport = transport;
        returnDeps();
    });

    templates.get(templateId, (err, template) => {
        if (err || !template) {
            return returnError(err || `Template '${templateId}' not found`);
        }
        deps.template = template;
        returnDeps();
    });

    settings.list(['adminEmail'], (err, configItems) => {
        if (err) {
            return returnError(err);
        }
        deps.configItems = configItems;
        returnDeps();
    });

    function returnError(err) {
        if (errSent) {
            return;
        }
        errSent = true;
        callback(err);
    }

    function returnDeps() {
        if (!deps.configItems || !deps.template || !deps.transport || errSent) {
            return;
        }
        callback(null, deps);
    }
}

function validateMailOptions(options) {
    let { EMAILS } = options;

    if (!EMAILS || EMAILS.length === 0) {
        throw new Error('Missing EMAILS');
    }
    if (typeof EMAILS === 'string') {
        EMAILS = EMAILS.split(',');
    }
    if (EMAILS.length > MAX_EMAILS) {
        throw new Error(`Cannot send more than ${MAX_EMAILS} emails at once`);
    }
}
