import { datumJsonToCbor } from 'lucid-cardano';
import { DatumParameterKey } from './constants';
import _ from 'lodash';
export class DefinitionBuilder {
    /**
     * Load a DEX definition file as a template for this builder.
     */
    async loadDefinition(definition) {
        this._definition = _.cloneDeepWith(definition, (value) => {
            if (value instanceof Function) {
                return value;
            }
        });
        return this;
    }
    /**
     * Push specified parameters to the definition template.
     */
    pushParameters(parameters) {
        if (!this._definition) {
            throw new Error(`Definition file must be loaded before applying parameters`);
        }
        this._definition = this.applyParameters(this._definition, parameters);
        return this;
    }
    /**
     * Pull parameters of a datum using a definition template.
     */
    pullParameters(definedDefinition) {
        if (!this._definition) {
            throw new Error(`Definition file must be loaded before pulling parameters`);
        }
        return this.extractParameters(definedDefinition, this._definition);
    }
    /**
     * Retrieve the CBOR for the builder.
     */
    getCbor() {
        return datumJsonToCbor(JSON.parse(JSON.stringify(this._definition)));
    }
    /**
     * Recursively set specified parameters.
     */
    applyParameters(field, mappedParameters) {
        if (field instanceof Function) {
            return field(field, mappedParameters, false);
        }
        if ('fields' in field) {
            if (typeof field.constructor === 'string') {
                const parameterValue = mappedParameters[field.constructor];
                if (typeof parameterValue !== 'number') {
                    throw new Error(`Invalid parameter value '${parameterValue}' for constructor value`);
                }
                field.constructor = parameterValue;
            }
            field.fields = field.fields.map((fieldParameter) => {
                return this.applyParameters(fieldParameter, mappedParameters);
            });
        }
        if ('int' in field) {
            let parameterValue = mappedParameters[field.int];
            if (typeof parameterValue === 'bigint') {
                parameterValue = Number(parameterValue);
            }
            if (typeof parameterValue !== 'number') {
                throw new Error(`Invalid parameter value '${parameterValue}' for type 'int'`);
            }
            field.int = parameterValue;
        }
        if ('bytes' in field) {
            const parameterValue = mappedParameters[field.bytes] ?? '';
            if (typeof parameterValue !== 'string') {
                throw new Error(`Invalid parameter value '${parameterValue}' for type 'bytes'`);
            }
            field.bytes = parameterValue;
        }
        return field;
    }
    /**
     * Recursively pull parameters from datum using definition template.
     */
    extractParameters(definedDefinition, templateDefinition, foundParameters = {}) {
        if (templateDefinition instanceof Function) {
            templateDefinition(definedDefinition, foundParameters);
            return foundParameters;
        }
        if (templateDefinition instanceof Array) {
            templateDefinition.map((fieldParameter, index) => {
                return this.extractParameters(fieldParameter, templateDefinition[index], foundParameters);
            }).forEach((parameters) => {
                foundParameters = { ...foundParameters, ...parameters };
            });
        }
        if ('fields' in definedDefinition) {
            if (!('fields' in templateDefinition)) {
                throw new Error("Template definition does not match with 'fields'");
            }
            if (typeof templateDefinition.constructor !== 'number') {
                foundParameters[templateDefinition.constructor] = definedDefinition.constructor;
            }
            else if (templateDefinition.constructor !== definedDefinition.constructor) {
                throw new Error("Template definition does not match with constructor value");
            }
            definedDefinition.fields.map((fieldParameter, index) => {
                return this.extractParameters(fieldParameter, templateDefinition.fields[index], foundParameters);
            }).forEach((parameters) => {
                foundParameters = { ...foundParameters, ...parameters };
            });
        }
        if ('int' in definedDefinition) {
            if (!('int' in templateDefinition)) {
                throw new Error("Template definition does not match with 'int'");
            }
            if (typeof templateDefinition.int !== 'number') {
                foundParameters[templateDefinition.int] = definedDefinition.int;
            }
        }
        if ('bytes' in definedDefinition) {
            if (!('bytes' in templateDefinition)) {
                throw new Error("Template definition does not match with 'bytes'");
            }
            const datumKeys = Object.values(DatumParameterKey);
            if (datumKeys.includes(templateDefinition.bytes)) {
                foundParameters[templateDefinition.bytes] = definedDefinition.bytes;
            }
        }
        return foundParameters;
    }
}
