# `pico-common`
A pico sized (~ 7kb) with zero dependency javascript library for commonly overlooked utility functions for both nodejs and the browser.

this library goes well with commonly used libraries such as lodash and react with little or no overlapping.

## features
Below are the main features

### data validator
A data driven data validator, suitable for simple to very complicated data structure. all you need is
1. define a schema/specification of your data
2. pass the schema and your data to the validator
3. it returns the result

[read more](man/obj_validate.md)

### deep merging
Like Object.assign but it does deep merging for object and array

[read more](man/obj_extend.md)

### route parser & route builder
building something like express router? this function can help you

> `/pico/common/str/route` + `/pico/:lib/:mod/:fun` -> {lib: 'common', mod: 'str', fun: 'route}

> `/pico/:lib/:mod/:fun` + {lib: 'common', mod: 'str', fun: 'route} -> `/pico/common/str/route`

[read more](man/str_restpath.md)

### cronjob
Need a cron schedule expressions parser? this is a pure javascript implementation can run on the browsers and nodejs. designed to work with `setTimeout`

[read more](man/time_cron.md)

### a javascript test framework for javascript lovers
expect('style').is.very.hard.to.remember.and.use('?'). Javascript [operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators#Comparison) is all you need.

this framework supported serial and pararellel test cases execution.

[read more](man/test_framework.md)

### module
A list of functions to you help to build your own sandbox module/dependency with asynchronous loader (similar to [AMD](https://github.com/amdjs/amdjs-api/blob/master/AMD.md))

[read more](man/amd.md)

### call stack
printing javascript function call stack? this is for you

[read more](man/func_call_stack.md)

### cleaner JSON.parse and JSON.stringify
these parse and stringify functions are designed to avoid unnecessary json stringify and parse and stringify-again in your workflow

for example
- A frontend **stringified** a big data structure for a request body
- expressjs bodyparser **parsed** entire request body but only part of them are use in server-side logic
- backend's model **stringified** part of the request body again and save it to db

with these functions
- frontend specially **stringify** the server needed data and db needed data in one string
- backend only **parse** backend needed data for server-side logic
- database needed can be saved as it is to db without stringification

[read more](man/json_codec.md)

### json path
xpath for json

[read more](man/json_path.md)

### optional chaining
A data driven [optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining), a optional chaining that can be saved and transport over network

[read more](man/obj_chain.md)

### html template engine
A 23 LOC html template engine

[read more](man/str_template.md)

## installing
[click here](man/install.md) browser and nodejs installation instruction 
