import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { Pays } from '../../pages/crud/pays/pays.model';
import { PaysUtilsService } from './pays-utils.service';

@Component({
  selector: 'app-pays-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule],
  template: `
    <p-dropdown
      [options]="paysList"
      [(ngModel)]="value"
      (ngModelChange)="onValueChange($event)"
      [optionLabel]="'nom'"
      [optionValue]="'id'"
      [filter]="filter"
      [filterBy]="'nom,code'"
      [showClear]="showClear"
      [placeholder]="placeholder"
      [disabled]="disabled"
      [emptyMessage]="emptyMessage"
      [emptyFilterMessage]="emptyFilterMessage"
      [styleClass]="styleClass"
      [virtualScroll]="virtualScroll"
      [virtualScrollItemSize]="38">
      
      <!-- Template pour chaque item dans la liste -->
      <ng-template let-pays pTemplate="item">
        <div class="flex items-center justify-between w-full py-1">
          <div class="flex items-center gap-2">
            <img *ngIf="pays.flagImage" 
                         [src]="pays.flagImage" 
                         [alt]="'Drapeau de ' + pays.nom" 
                         class="flag-thumbnail" />
            <span class="font-medium">{{ pays.nom }}</span>
          </div>
          <span class="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
            {{ pays.code }}
          </span>
        </div>
      </ng-template>
      
      <!-- Template pour l'item sélectionné -->
      <ng-template let-pays pTemplate="selectedItem">
        <div class="flex items-center gap-2" *ngIf="pays">
          <img *ngIf="pays.flagImage" 
                         [src]="pays.flagImage" 
                         [alt]="'Drapeau de ' + pays.nom" 
                         class="flag-thumbnail" />
          <span class="font-medium">{{ pays.nom }}</span>
          <span class="text-xs text-gray-500 font-mono">{{ pays.code }}</span>
        </div>
      </ng-template>
    </p-dropdown>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PaysDropdownComponent),
      multi: true
    }
  ]
})
export class PaysDropdownComponent implements ControlValueAccessor {
  @Input() paysList: Pays[] = [];  // ✅ Utilise l'interface commune
  @Input() filter: boolean = true;
  @Input() showClear: boolean = true;
  @Input() placeholder: string = 'Sélectionner un pays';
  @Input() emptyMessage: string = 'Aucun pays trouvé';
  @Input() emptyFilterMessage: string = 'Aucun résultat';
  @Input() styleClass: string = 'w-full';
  @Input() virtualScroll: boolean = true;
  @Input() disabled: boolean = false;

  @Output() selectionChange = new EventEmitter<number | null>();

  value: number | null = null;

  constructor(private paysUtils: PaysUtilsService) {}

  // ControlValueAccessor methods
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(value: number | null): void {
    this.onChange(value);
    this.onTouched();
    this.selectionChange.emit(value);
  }

  getFlagEmoji(code: string): string {
    return this.paysUtils.getFlagEmoji(code);
  }
}