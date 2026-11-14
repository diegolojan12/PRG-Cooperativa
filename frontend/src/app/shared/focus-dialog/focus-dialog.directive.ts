import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  inject,
} from '@angular/core';
@Directive({ selector: '[appFocusDialog]' })
export class FocusDialogDirective implements AfterViewInit, OnDestroy {
  private element = inject<ElementRef<HTMLElement>>(ElementRef);
  private previous = document.activeElement as HTMLElement | null;
  private overflow = document.body.style.overflow;
  private controls() {
    return Array.from(
      this.element.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])',
      ),
    ).filter((x) => x.offsetParent !== null);
  }
  ngAfterViewInit() {
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const input = this.element.nativeElement.querySelector<HTMLElement>(
        'input:not([disabled]),select:not([disabled])',
      );
      (input || this.controls()[0])?.focus();
    });
  }
  @HostListener('keydown', ['$event']) onKey(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const items = this.controls(),
      first = items[0],
      last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  ngOnDestroy() {
    document.body.style.overflow = this.overflow;
    this.previous?.focus();
  }
}
