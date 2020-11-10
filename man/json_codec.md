`pJSON.stringify` and `pJSON.parse` functions are created to overcome nested JSON issue.

## syntax
> pJSON.stringify(object, deep)

### parameters
__object__, _object_, object to be stringigy 

__deep__, _bool_, true if nested object need to be stringify 

### returns
a json string without nested objects

## syntax
> pJSON.parse(pjson, deep)

### parameters
__pjson__, _string_, string with pJSON format

__deep__, _object_, true if nested object need to be parsed
