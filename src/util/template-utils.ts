import * as Handlebars from 'handlebars'
import * as  Lodash from "lodash";
import * as dayjs from 'dayjs'


/** 
 * assign: 给当前上下文变量赋值
 * camelCase: 驼峰命名
 * snakeCase: 下划线命名
 * kebabCase: 中划线命名
 * upperFirst: 首字母大写
 * lowerFirst: 首字母小写
 * toLower: 转小写
 * toUpper: 转大写
 * formatNow: 格式化当前时间
 * contains: 当前上下文是否包含指定值
 * formatNowNormDatetime: 格式化当前时间为 YYYY-MM-DD HH:mm:ss
 * formatNowNormDatetimeDateSlash: 格式化当前时间为 YYYY/MM/DD HH:mm:ss
 * equals: 参数1===参数2
 * lte: 参数1<参数2
 * gte: 参数1>参数2
 */
function registerHandlebarsHelper() {
    const stringMethodNames = ['camelCase', 'snakeCase', 'kebabCase', 'upperFirst', 'lowerFirst', 'toLower', 'toUpper'];
    for (const smn of stringMethodNames) {
        Handlebars.registerHelper(smn, text => {
            return Lodash[smn](text);
        });
    }
    Handlebars.registerHelper('formatNow', text => {
        return dayjs().format(text);
    })
    Handlebars.registerHelper('formatNowNormDatetime', () => {
        return dayjs().format('YYYY-MM-DD HH:mm:ss');
    })
    Handlebars.registerHelper('formatNowNormDatetimeDateSlash', () => {
        return dayjs().format('YYYY/MM/DD HH:mm:ss');
    })
    Handlebars.registerHelper('assign', function () {
        const options = arguments[arguments.length - 1];
        const root = options.data.root;
        const jsonText = options.fn(root);
        const assignJson = JSON.parse(jsonText)
        if (arguments.length > 1 && arguments[0] instanceof Object) {
            Object.assign(arguments[0], assignJson);
        } else {
            Object.assign(root, assignJson);
        }
        return null;
    })
    Handlebars.registerHelper('contains', function () {
        const options = arguments[arguments.length - 1];
        const context = arguments.length > 1 ? arguments[0] : options.data.root;
        const value = Handlebars.compile(options.hash.value)(this);
        if (Array.isArray(context)) {
            return context.includes(value);
        }
        if ((typeof context) === 'string') {
            return context.contains(value);
        }
        if ((typeof context) === 'object') {
            return Object.keys(context).includes(value);
        }
        return false;
    })
    Handlebars.registerHelper('equals', function (v1, v2) {
        return Lodash.isEqual(v1, v2);
    })
    Handlebars.registerHelper('lte', function (v1, v2) {
        console.log(v1, v2);
        return Lodash.lte(v1, v2);
    })
    Handlebars.registerHelper('gte', function (v1, v2) {
        return Lodash.gte(v1, v2);
    })
}


registerHandlebarsHelper();

export { Handlebars }