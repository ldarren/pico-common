declare module "pico-common" {
    type Callback<T = any> = (err: Error | null, result?: T) => void;

    interface AjaxOptions {
        baseurl?: string | null;
    }

    interface Environment {
        build: 'dev' | 'prod';
    }

    interface Preprocessor {
        (url: string, func: Function): Function;
    }

    interface ModuleExports {
        [key: string]: any;
    }

    interface DefineFunction {
        (url: string, func: Function, mute?: boolean): any;
    }

    interface pDummy {
        run: Callback;
        inherit: Callback;
        reload: Callback;
        parse: Callback;
        define: DefineFunction;
        import: Callback;
        export: Callback;
        env: (key: string) => any;
        ajax: Callback;
    }

		export interface pRunOptions {
				ajax?: any; // Assuming 'ajax' can be of any type. Replace 'any' with the specific type if known
				baseurl?: string;
				paths?: any; // Assuming 'paths' can be of any type. Replace 'any' with the specific type if known
				env?: any; // Assuming 'env' can be of any type. Replace 'any' with the specific type if known
				preprocessors?: { [key: string]: (url: string, module: any) => any }; // Replace 'any' with specific types if known
				importRule?: any; // Replace 'any' with the specific type if known
				onLoad?: (callback: () => void) => void;
				name?: string | null;
		}


    class Pico {
        static run(options: pRunOptions, func: Function): void;
        static reload(url: string, script: string | Callback, cb?: Callback): void;
        static parse(url: string, txt: string, cb?: Callback): void;
        static define: DefineFunction;
        static import(url: string): any;
        static export(url: string, cb?: Callback): any;
        static env: (key: string) => any;
    }

    function define(url: string, func: Function, mute?: boolean): any;
    function pico(): pDummy;

    export = Pico;
}

