import { DOCUMENT } from '@angular/common'
import {
  Directive,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
  inject,
} from '@angular/core'

export type ColorMode =
  | 'color'
  | 'c'
  | '1'
  | 'grayscale'
  | 'g'
  | '2'
  | 'presets'
  | 'p'
  | '3'

export type AlphaChannel = 'enabled' | 'disabled' | 'always' | 'forced'

export type BoundingRectangle = {
  top: number
  bottom: number
  left: number
  right: number
  height: number
  width: number
}

export type OutputFormat = 'auto' | 'hex' | 'rgba' | 'hsla'

export function calculateAutoPositioning(
  elBounds: BoundingRectangle,
  triggerElBounds: BoundingRectangle,
  window: Window
): string {
  // Defaults
  let usePositionX = 'right'
  let usePositionY = 'bottom'
  // Calculate collisions
  const { height, width } = elBounds
  const { top, left } = triggerElBounds
  const bottom = top + triggerElBounds.height
  const right = left + triggerElBounds.width

  const collisionTop = top - height < 0
  const collisionBottom =
    bottom + height >
    (window.innerHeight || document.documentElement.clientHeight)
  const collisionLeft = left - width < 0
  const collisionRight =
    right + width > (window.innerWidth || document.documentElement.clientWidth)
  const collisionAll =
    collisionTop && collisionBottom && collisionLeft && collisionRight

  // Generate X & Y position values
  if (collisionBottom) {
    usePositionY = 'top'
  }

  if (collisionTop) {
    usePositionY = 'bottom'
  }

  if (collisionLeft) {
    usePositionX = 'right'
  }

  if (collisionRight) {
    usePositionX = 'left'
  }

  // Choose the largest gap available
  if (collisionAll) {
    const postions = ['left', 'right', 'top', 'bottom']
    return postions.reduce((prev, next) =>
      elBounds[prev] > elBounds[next] ? prev : next
    )
  }

  if (collisionLeft && collisionRight) {
    if (collisionTop) {
      return 'bottom'
    }
    if (collisionBottom) {
      return 'top'
    }
    return top > bottom ? 'top' : 'bottom'
  }

  if (collisionTop && collisionBottom) {
    if (collisionLeft) {
      return 'right'
    }
    if (collisionRight) {
      return 'left'
    }
    return left > right ? 'left' : 'right'
  }

  return `${usePositionY}-${usePositionX}`
}

@Directive({
  selector: '[text]',
})
export class TextDirective {
  @Input() rg: number
  @Input() text: any

  @Output() newValue = new EventEmitter<any>()

  @HostListener('input', ['$event']) inputChange(event: any): void {
    const value = event.target.value

    if (this.rg === undefined) {
      this.newValue.emit(value)
    } else {
      const numeric = parseFloat(value)

      this.newValue.emit({ v: numeric, rg: this.rg })
    }
  }
}

@Directive({
  selector: '[slider]',
})
export class SliderDirective {
  private elRef = inject(ElementRef)
  private document = inject<Document>(DOCUMENT)

  private readonly listenerMove: (event: Event) => void
  private readonly listenerStop: () => void

  @Input() rgX: number
  @Input() rgY: number

  @Output() dragEnd = new EventEmitter()
  @Output() dragStart = new EventEmitter()

  @Output() newValue = new EventEmitter<any>()

  @HostListener('mousedown', ['$event']) mouseDown(event: any): void {
    this.start(event)
  }

  @HostListener('touchstart', ['$event']) touchStart(event: any): void {
    this.start(event)
  }

  constructor() {
    this.listenerMove = (event: Event) => this.move(event)

    this.listenerStop = () => this.stop()
  }

  private move(event: Event): void {
    event.preventDefault()

    this.setCursor(event)
  }

  private start(event: Event): void {
    this.setCursor(event)

    event.stopPropagation()

    this.document.addEventListener('mouseup', this.listenerStop)
    this.document.addEventListener('touchend', this.listenerStop)
    this.document.addEventListener('mousemove', this.listenerMove)
    this.document.addEventListener('touchmove', this.listenerMove)

    this.dragStart.emit()
  }

  private stop(): void {
    this.document.removeEventListener('mouseup', this.listenerStop)
    this.document.removeEventListener('touchend', this.listenerStop)
    this.document.removeEventListener('mousemove', this.listenerMove)
    this.document.removeEventListener('touchmove', this.listenerMove)

    this.dragEnd.emit()
  }

  private getX(event: any): number {
    const position = this.elRef.nativeElement.getBoundingClientRect()

    const pageX =
      event.pageX !== undefined ? event.pageX : event.touches[0].pageX

    return pageX - position.left - window.pageXOffset
  }

  private getY(event: any): number {
    const position = this.elRef.nativeElement.getBoundingClientRect()

    const pageY =
      event.pageY !== undefined ? event.pageY : event.touches[0].pageY

    return pageY - position.top - window.pageYOffset
  }

  private setCursor(event: any): void {
    const width = this.elRef.nativeElement.offsetWidth
    const height = this.elRef.nativeElement.offsetHeight

    const x = Math.max(0, Math.min(this.getX(event), width))
    const y = Math.max(0, Math.min(this.getY(event), height))

    if (this.rgX !== undefined && this.rgY !== undefined) {
      this.newValue.emit({
        s: x / width,
        v: 1 - y / height,
        rgX: this.rgX,
        rgY: this.rgY,
      })
    } else if (this.rgX === undefined && this.rgY !== undefined) {
      this.newValue.emit({ v: y / height, rgY: this.rgY })
    } else if (this.rgX !== undefined && this.rgY === undefined) {
      this.newValue.emit({ v: x / width, rgX: this.rgX })
    }
  }
}

export class SliderPosition {
  constructor(
    public h: number,
    public s: number,
    public v: number,
    public a: number
  ) {}
}

export class SliderDimension {
  constructor(
    public h: number,
    public s: number,
    public v: number,
    public a: number
  ) {}
}
