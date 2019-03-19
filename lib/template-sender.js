'use strict';

let mailer = require('./mailer');
let settings = require('./models/settings');
let templates = require('./models/templates');

module.exports = createTemplateSender;

const MAX_EMAILS = 100;

function createTemplateSender(templateId, callback) {
    if (!templateId) {
        return callback(
            'Cannot create TemplateSender instance without templateId'
        );
    }

    let errSent = false;
    let configItems, template, transport;

    mailer.getMailer((err, trans) => {
        if (err) {
            return returnError(err);
        }
        transport = trans;
        returnMailSender();
    });

    templates.get(templateId, (err, loadedTemplate) => {
        if (err || !loadedTemplate) {
            return returnError(err || `Template '${templateId}' not found`);
        }
        template = loadedTemplate;
        returnMailSender();
    });

    settings.list(['adminEmail'], (err, confItems) => {
        if (err) {
            return returnError(err);
        }
        configItems = confItems;
        returnMailSender();
    });

    function returnError(err) {
        if (errSent) {
            return;
        }
        errSent = true;
        callback(err);
    }

    function returnMailSender() {
        if (!configItems || !template || !transport || errSent) {
            return;
        }

        callback(null, createMailSender(configItems, template, transport));
    }
}

function createMailSender(configItems, template, transport) {
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
