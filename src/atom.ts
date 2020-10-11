import * as L from "./lens";
import { Atom, AtomSeed, Observer, Property, Event, valueEvent, isValue } from "./abstractions";
import { Dispatcher } from "./dispatcher";
import { afterScope, beforeScope, checkScope, globalScope, OutOfScope, Scope } from "./scope";
import { duplicateSkippingObserver } from "./util";
import { mapObserver } from "./map";

type AtomEvents<V> = { "change": V }

class RootAtom<V> extends Atom<V> {    
    private _dispatcher = new Dispatcher<AtomEvents<V>>();
    private _value: V

    constructor(desc: string, initialValue: V) {
        super(desc)
        this._value = initialValue        
    }

    onChange(observer: Observer<Event<V>>) {
        return this._dispatcher.on("change", observer)        
    }

    get(): V {
        return this._value
    }
    set(newValue: V): void {
        this._value = newValue;
        this._dispatcher.dispatch("change", valueEvent(newValue))
    }

    modify(fn: (old: V) => V): void {
        this.set(fn(this._value))
    }
    getScope() {
        return globalScope
    }
}

class LensedAtom<R, V> extends Atom<V> {
    private _root: Atom<R>;
    private _lens: L.Lens<R, V>;

    constructor(desc: string, root: Atom<R>, view: L.Lens<R, V>) {
        super(desc)
        this._root = root;
        this._lens = view;
    }

    get() {
        return this._lens.get(this._root.get())
    }

    set(newValue: V) {
        this._root.set(this._lens.set(this._root.get(), newValue))
    }

    modify(fn: (old: V) => V) {
        this._root.modify(oldRoot => this._lens.set(oldRoot, fn(this._lens.get(oldRoot))))
    }

    onChange(observer: Observer<Event<V>>) {
        const unsub = this._root.onChange(event => {
            if (isValue(event)) {
                const value = this._lens.get(event.value)
                if (value !== current) {
                    current = value
                    observer(valueEvent(value))
                }
            } else {
                observer(event)
            }
        })
        let current = this.get()
        return unsub
    }

    getScope() {
        return this._root.getScope()
    }
}

class DependentAtom<V> extends Atom<V> {
    private _input: Property<V>;
    set: (updatedValue: V) => void;

    constructor(desc: string, input: Property<V>, set: (updatedValue: V) => void) {
        super(desc)
        this._input = input;
        this.set = set
    }

    onChange(observer: Observer<Event<V>>) {
        return this._input.onChange(observer)
    }

    get() {
        return this._input.get()
    }

    modify(fn: (old: V) => V) {
        this.set(fn(this.get()))
    }

    getScope() {
        return this._input.getScope()
    }
    
}

export class StatefulDependentAtom<V> extends Atom<V> {
    private _scope: Scope
    private _dispatcher = new Dispatcher<AtomEvents<V>>();
    private _value: V | OutOfScope = beforeScope

    constructor(seed: AtomSeed<V>, scope: Scope) {
        super(seed.desc)
        this._scope = scope;
        this.set = seed.set;
        
        const meAsObserver = (event: Event<V>) => {
            if (isValue(event)) {
                if (event.value !== this._value) {
                    this._value = event.value
                    this._dispatcher.dispatch("change", event)
                }
            } else {
                this._dispatcher.dispatch("change", event)
            }
        }
        scope(
            () => {
                const unsub = seed.onChange(meAsObserver);
                this._value = seed.get();
                return () => {
                    this._value = afterScope; 
                    unsub!()
                }
            }, 
            this._dispatcher
        )
    }
    get(): V {
        return checkScope(this, this._value)
    }

    set: (updatedValue: V) => void;
    
    modify(fn: (old: V) => V) {
        this.set(fn(this.get()))
    }
    onChange(observer: Observer<Event<V>>) {
        return this._dispatcher.on("change", observer)
    }    
    getScope() {
        return this._scope
    }

}

export function view<A, K extends keyof A>(a: Atom<A>, key: K): K extends number ? Atom<A[K] | undefined> : Atom<A[K]>;
export function view<A, B>(a: Atom<A>, lens: L.Lens<A, B>): Atom<B>;
export function view<A, B>(atom: Atom<A>, view: any): Atom<B> {
    if (typeof view === "string") {
        return new LensedAtom<A, B>(atom + "." + view, atom, L.prop<any, any>(view))
    }
    else if (typeof view === "number") {                        
        return new LensedAtom(atom + `[${view}]`, atom, L.item(view as number) as any)
    } else {
        return new LensedAtom(atom + ".view(..)", atom, view)
    }   
}
export function atom<A>(initial: A): Atom<A>;
/**
 * Create a dependent atom that reflects the value of the given Property. The `onChange` function
 * is supposed to eventually cause the `input` property to be updated to the new value.
 * 
 * This constructor provides a bridge between atom-based components and "unidirectional data flow"
 * style state management.
 * 
 * Note: unlike an independent atom, the dependent atom is lazy. This means that it will keep its
 * value up-to-date only if there is a subscriber to it or the underlying property.
 * 
 * @param input      Property to reflect
 * @param onChange   Function to be called when `atom.set` is called
 */
export function atom<A>(input: Property<A>, onChange: (updatedValue: A) => void): Atom<A>;

export function atom<A>(x: any, y?: any): Atom<A> {
    if (arguments.length == 1) {
        return new RootAtom<A>("RootAtom", x)
    } else {
        return new DependentAtom(`DependentAtom(${x})`, x, y)
    }
}