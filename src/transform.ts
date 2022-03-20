import {
  Atom,
  AtomSeed,
  composeDesc,
  Desc,
  EventStream,
  EventStreamSeed,
  isAtomSeed,
  isEventStreamSeed,
  ScopedObservable,
  isPropertySeed,
  MethodDesc,
  Observable,
  ObservableSeed,
  Observer,
  Property,
  PropertySeed,
  Scope,
  Subscribe,
} from "./abstractions"
import { applyScopeMaybe } from "./applyscope"
import { EventStreamSeedImpl } from "./eventstream"
import { PropertySeedImpl } from "./property"
import { AtomSeedImpl } from "./atom"
import { HKT } from "./hkt"

export type SubscriptionTransformer<A, B> = (
  subscribe: Subscribe<A>
) => Subscribe<B>

export type StreamTransformer<A, B> = SubscriptionTransformer<A, B>

export type Transformer<A, B> = {
  changes: StreamTransformer<A, B>
  init: (value: A) => B
}

export type StatefulTransformResult<B, O> = O extends PropertySeed<any>
  ? PropertySeed<B>
  : O extends EventStreamSeed<any>
  ? EventStreamSeed<B>
  : never

export type StatefulTransformResultScoped<B, O> = O extends PropertySeed<any>
  ? Property<B>
  : O extends EventStreamSeed<any>
  ? EventStream<B>
  : never

export type StatefulUnaryTransformResult<O> = O extends AtomSeed<infer A>
  ? AtomSeed<A>
  : O extends PropertySeed<infer A>
  ? PropertySeed<A>
  : O extends EventStreamSeed<infer A>
  ? EventStreamSeed<A>
  : never

export type StatefulUnaryTransformResultScoped<O> = O extends AtomSeed<infer A>
  ? Atom<A>
  : O extends PropertySeed<infer A>
  ? Property<A>
  : O extends EventStreamSeed<infer A>
  ? EventStream<A>
  : never

export type StatefulUnaryTransformResultFor<O, A> = O extends AtomSeed<any>
  ? AtomSeed<A>
  : O extends PropertySeed<any>
  ? PropertySeed<A>
  : O extends EventStreamSeed<any>
  ? EventStreamSeed<A>
  : never

export type StatefulUnaryTransformResultScopedFor<O, A> =
  O extends AtomSeed<any>
    ? Atom<A>
    : O extends PropertySeed<any>
    ? Property<A>
    : O extends EventStreamSeed<any>
    ? EventStream<A>
    : never

export interface GenericTransformOp {
  <A, O>(o: In<O, A>): StatefulUnaryTransformResult<O>
}

export interface GenericTransformOpScoped {
  <A, O>(o: In<O, A>): StatefulUnaryTransformResultScoped<O>
}

export interface BinaryTransformOp<A, B> {
  <O>(o: In<O, A>): StatefulTransformResult<B, O>
}

export interface BinaryTransformOpScoped<A, B> {
  <O>(o: In<O, A>): StatefulTransformResultScoped<B, O>
}

export interface StreamTransformOp<A, B> {
  (seed: EventStreamSeed<A> | EventStream<A>): EventStreamSeed<B>
}

export interface StreamTransformOpScoped<A, B> {
  (seed: EventStreamSeed<A> | EventStream<A>): EventStream<B>
}

export type In<ObsType, ValueType> = HKT<ObsType> &
  ObservableSeed<ValueType, any, any>

export interface UnaryTransformOp<A, B = A> {
  <O>(o: In<O, A>): StatefulUnaryTransformResultFor<O, B>
}

export interface UnaryTransformOpScoped<A, B extends A = A> {
  <O>(o: In<O, A>): StatefulUnaryTransformResultScopedFor<O, B>
}

export const IdentityTransformer = {
  changes: <A>(subscribe: Subscribe<A>) => subscribe,
  init: <A>(value: A) => value,
}

export function transform<A>(
  desc: MethodDesc,
  transformer: Transformer<A, A>
): UnaryTransformOp<A>
export function transform<A>(
  desc: MethodDesc,
  transformer: Transformer<A, A>,
  scope: Scope
): UnaryTransformOpScoped<A>
export function transform<A, B>(
  desc: MethodDesc,
  transformer: Transformer<A, B>
): BinaryTransformOp<A, B>
export function transform<A, B>(
  desc: MethodDesc,
  transformer: Transformer<A, B>,
  scope: Scope
): BinaryTransformOpScoped<A, B>
export function transform<A, B>(
  desc: MethodDesc,
  transformer: StreamTransformer<A, B>
): StreamTransformOp<A, B>
export function transform<A, B>(
  desc: MethodDesc,
  transformer: StreamTransformer<A, B>,
  scope: Scope
): StreamTransformOpScoped<A, B>

export function transform<A, B>(
  methodCallDesc: MethodDesc,
  transformer: Transformer<A, B> | StreamTransformer<A, B>,
  scope?: Scope
): any {
  return (x: ObservableSeed<any, any, any>) => {
    const desc = composeDesc(x, methodCallDesc)
    if (isEventStreamSeed<A>(x)) {
      let transformFn =
        transformer instanceof Function ? transformer : transformer.changes
      const source = x.consume()
      return applyScopeMaybe(
        new EventStreamSeedImpl(
          desc,
          transformFn(source.subscribe.bind(source))
        ),
        scope
      ) // TODO: should we always bind?
    }
    const t = transformer as Transformer<A, B>
    if (isAtomSeed<A>(x)) {
      const source = x.consume()
      return applyScopeMaybe(
        new AtomSeedImpl(
          desc,
          () => t.init(source.get()),
          transformPropertySubscribe(source, t),
          (newValue) =>
            source.set(newValue as any as A /* A and B are equal for atoms */)
        ),
        scope
      )
    } else if (isPropertySeed<A>(x)) {
      const source = x.consume()
      return applyScopeMaybe(
        new PropertySeedImpl(
          desc,
          () => t.init(source.get()),
          transformPropertySubscribe(source, t)
        ),
        scope
      )
    } else {
      throw Error("Unknown observable " + x)
    }
  }
}

function transformPropertySubscribe<A, B>(
  src: { onChange: Subscribe<A> },
  transformer: Transformer<A, B>
): Subscribe<B> {
  if (src === undefined) throw Error("Assertion failed")
  return transformer.changes(src.onChange.bind(src)) // TODO: should we always bind?
}
