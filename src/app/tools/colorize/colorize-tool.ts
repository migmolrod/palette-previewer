import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, linkedSignal, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { downloadBlob, slug } from '../../export/download';
import { PaletteSession } from '../../library/palette-session';
import { MODES, type Mode } from '../../palette/mode';
import { SliderField } from '../../ui/slider-field/slider-field';
import { AccentStore, registerAccentEditor } from '../accent/accent-store';
import type { RecolorJob } from './colorize-messages';
import { paletteColors, type PaletteColors } from './colorize-palette';
import { Colorizer } from './colorizer';
import { ImageCompare } from './image-compare/image-compare';
import { DEFAULT_RECOLOR_SETTINGS, type RecolorMethod, type RecolorSettings } from './recolor';

/** Recolors an uploaded image (e.g. a wallpaper) with the current palette. */
@Component({
  imports: [
    ButtonModule,
    FieldsetModule,
    FormsModule,
    ImageCompare,
    SelectButtonModule,
    SliderField,
    ToggleSwitchModule,
  ],
  providers: [AccentStore, Colorizer],
  selector: 'app-colorize-tool',
  styleUrl: './colorize-tool.scss',
  templateUrl: './colorize-tool.html',
})
export class ColorizeTool {
  private readonly store = inject(AccentStore);
  private readonly colorizer = inject(Colorizer);
  private readonly session = inject(PaletteSession);
  private readonly document = inject(DOCUMENT);

  protected readonly defaults = DEFAULT_RECOLOR_SETTINGS;
  protected readonly methods: { label: string; value: RecolorMethod }[] = [
    { label: 'Smooth', value: 'smooth' },
    { label: 'Posterize', value: 'posterize' },
  ];
  protected readonly colorSets: { label: string; value: PaletteColors }[] = [
    { label: 'Terminal', value: 'terminal' },
    { label: 'All ramps', value: 'ramps' },
  ];
  protected readonly modes = MODES.map((value) => ({
    label: value === 'dark' ? 'Dark' : 'Light',
    value,
  }));

  protected readonly method = signal(DEFAULT_RECOLOR_SETTINGS.method);
  protected readonly radius = signal(DEFAULT_RECOLOR_SETTINGS.radius);
  protected readonly keepLightness = signal(DEFAULT_RECOLOR_SETTINGS.keepLightness);
  protected readonly strength = signal(DEFAULT_RECOLOR_SETTINGS.strength);
  protected readonly dither = signal(DEFAULT_RECOLOR_SETTINGS.dither);
  protected readonly colors = signal<PaletteColors>('terminal');
  /** Only the terminal colors differ between modes. */
  protected readonly mode = signal<Mode>('dark');

  private readonly settings = computed<RecolorSettings>(() => ({
    method: this.method(),
    radius: this.radius(),
    keepLightness: this.keepLightness(),
    strength: this.strength(),
    dither: this.dither(),
  }));
  private readonly job = computed<RecolorJob>(() => ({
    palette: paletteColors(this.store.result(), this.mode(), this.colors()),
    settings: this.settings(),
  }));
  protected readonly colorCount = computed(() => this.job().palette.length);

  private readonly file = signal<File | undefined>(undefined);
  protected readonly image = resource({
    params: () => this.file(),
    loader: async ({ params: file }) => ({
      ...(await this.colorizer.load(file)),
      name: file.name,
      url: URL.createObjectURL(file),
    }),
  });

  protected readonly preview = resource({
    params: () => (this.image.hasValue() ? this.job() : undefined),
    loader: ({ params: job, abortSignal }) => this.colorizer.preview(job, abortSignal),
  });
  /** Latest preview of the current image, kept on screen while the next one is recolored. */
  protected readonly shownPreview = linkedSignal<
    { image: unknown; bitmap: ImageBitmap | undefined },
    ImageBitmap | undefined
  >({
    source: () => ({
      image: this.image.hasValue() ? this.image.value() : undefined,
      bitmap: this.preview.hasValue() ? this.preview.value() : undefined,
    }),
    computation: (current, previous) =>
      current.bitmap ??
      (previous && previous.source.image === current.image ? previous.value : undefined),
  });

  protected readonly formatRadius = (value: number) => value.toFixed(3);
  protected readonly formatPercent = (value: number) => `${Math.round(value * 100)}%`;

  protected readonly dragging = signal(false);
  protected readonly exporting = signal(false);
  /** Progress and errors, announced to screen readers. */
  protected readonly status = signal('');

  constructor() {
    registerAccentEditor(this.store);
    effect((onCleanup) => {
      const url = this.image.hasValue() ? this.image.value().url : undefined;
      if (url) onCleanup(() => URL.revokeObjectURL(url));
    });
    effect(() => {
      if (this.image.status() === 'error')
        this.status.set('That file could not be read as an image');
      else if (this.preview.status() === 'error') this.status.set('Recoloring failed');
    });
  }

  protected choose(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (file) this.open(file);
    input.value = '';
  }

  protected dropped(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.open(file);
  }

  protected dragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected async download(): Promise<void> {
    if (!this.image.hasValue()) return;
    const { name } = this.image.value();
    this.exporting.set(true);
    this.status.set('Recoloring at full resolution…');
    try {
      const png = await this.colorizer.export(this.job());
      const stem = name.replace(/\.[^.]*$/, '');
      downloadBlob(this.document, `${stem}-${slug(this.session.name())}.png`, png);
      this.status.set('Downloaded');
    } catch {
      this.status.set('Export failed');
    } finally {
      this.exporting.set(false);
    }
  }

  private open(file: File): void {
    this.status.set(`Opened ${file.name}`);
    this.file.set(file);
  }
}
