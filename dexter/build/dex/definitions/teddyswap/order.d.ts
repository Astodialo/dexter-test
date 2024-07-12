import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';
declare const _default: {
    constructor: number;
    fields: (((field: DefinitionField, parameters: DatumParameters, shouldExtract?: boolean) => {
        constructor: number;
        fields: {
            bytes: string;
        }[];
    } | undefined) | {
        constructor: number;
        fields: {
            bytes: DatumParameterKey;
        }[];
        int?: undefined;
        bytes?: undefined;
    } | {
        int: DatumParameterKey;
        constructor?: undefined;
        fields?: undefined;
        bytes?: undefined;
    } | {
        bytes: DatumParameterKey;
        constructor?: undefined;
        fields?: undefined;
        int?: undefined;
    })[];
};
export default _default;
