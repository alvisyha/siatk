'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onFocusCb?: (e: React.FocusEvent<any>) => void;
    onBlurCb?: (e: React.FocusEvent<any>) => void;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = '-- Pilih --',
    required = false,
    className = '',
    style = {},
    onFocusCb,
    onBlurCb
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get the label for the currently selected value
    const selectedOption = options.find(o => o.value === value);

    // Filter options based on search term
    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Reset highlight when filtered results change
    useEffect(() => {
        setHighlightIndex(-1);
    }, [searchTerm]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[data-option]');
            items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightIndex]);

    // Calculate dropdown position when opening
    const updateDropdownPosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
    }, []);

    // Recalculate position on scroll/resize while open
    useEffect(() => {
        if (!isOpen) return;

        updateDropdownPosition();

        const handleScrollOrResize = () => updateDropdownPosition();

        // Listen to scroll on all ancestors (captures modal scroll too)
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen, updateDropdownPosition]);

    // Close dropdown on outside click (must check both container and portal dropdown)
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const inContainer = containerRef.current?.contains(target);
            const inDropdown = dropdownRef.current?.contains(target);
            if (!inContainer && !inDropdown) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleOpen = useCallback(() => {
        setIsOpen(true);
        setSearchTerm('');
        setHighlightIndex(-1);
        // Focus the search input after the dropdown opens
        setTimeout(() => inputRef.current?.focus(), 0);
    }, []);

    const handleSelect = useCallback((optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    }, [onChange]);

    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
        setIsOpen(false);
    }, [onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault();
                handleOpen();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightIndex(prev =>
                    prev < filtered.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightIndex(prev =>
                    prev > 0 ? prev - 1 : filtered.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightIndex >= 0 && highlightIndex < filtered.length) {
                    handleSelect(filtered[highlightIndex].value);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearchTerm('');
                break;
        }
    }, [isOpen, filtered, highlightIndex, handleOpen, handleSelect]);

    // Portal dropdown content
    const dropdownContent = isOpen && dropdownPos && createPortal(
        <div
            ref={dropdownRef}
            className="searchable-select-dropdown"
            style={{
                position: 'fixed',
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
                zIndex: 99999,
                background: 'var(--surface)',
                border: '1.5px solid var(--primary)',
                borderRadius: '10px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15), 0 4px 12px rgba(99,102,241,0.1)',
                overflow: 'hidden',
            }}
        >
            {/* Search input */}
            <div
                style={{
                    padding: '8px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg)',
                }}
            >
                <div style={{ position: 'relative' }}>
                    <Search
                        className="w-3.5 h-3.5"
                        style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            pointerEvents: 'none',
                        }}
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ketik untuk mencari barang..."
                        style={{
                            width: '100%',
                            padding: '8px 10px 8px 32px',
                            fontSize: '13px',
                            border: '1.5px solid var(--border)',
                            borderRadius: '8px',
                            outline: 'none',
                            background: 'var(--surface)',
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit',
                            transition: 'border-color 0.15s',
                        }}
                        onFocus={e => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                        }}
                        onBlur={e => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    />
                </div>
            </div>

            {/* Options list */}
            <ul
                ref={listRef}
                role="listbox"
                style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    margin: 0,
                    padding: '4px',
                    listStyle: 'none',
                }}
            >
                {filtered.length === 0 ? (
                    <li
                        style={{
                            padding: '12px 16px',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '13px',
                            fontStyle: 'italic',
                        }}
                    >
                        Barang tidak ditemukan
                    </li>
                ) : (
                    filtered.map((option, idx) => {
                        const isSelected = option.value === value;
                        const isHighlighted = idx === highlightIndex;

                        return (
                            <li
                                key={option.value}
                                data-option
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => handleSelect(option.value)}
                                onMouseEnter={() => setHighlightIndex(idx)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: isSelected ? 600 : 400,
                                    color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                                    background: isHighlighted
                                        ? 'var(--primary-light, rgba(99,102,241,0.08))'
                                        : isSelected
                                            ? 'rgba(99,102,241,0.05)'
                                            : 'transparent',
                                    transition: 'background 0.1s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <span className="truncate">{option.label}</span>
                                {isSelected && (
                                    <span
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            color: 'var(--primary)',
                                            opacity: 0.7,
                                        }}
                                    >
                                        ✓
                                    </span>
                                )}
                            </li>
                        );
                    })
                )}
            </ul>

            {/* Result count footer */}
            {searchTerm && filtered.length > 0 && (
                <div
                    style={{
                        padding: '6px 12px',
                        borderTop: '1px solid var(--border)',
                        background: 'var(--bg)',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        textAlign: 'right',
                    }}
                >
                    {filtered.length} dari {options.length} barang
                </div>
            )}
        </div>,
        document.body
    );

    return (
        <div ref={containerRef} className="searchable-select-container" style={{ position: 'relative' }}>
            {/* Hidden native input for form validation */}
            {required && (
                <input
                    type="text"
                    required
                    value={value}
                    onChange={() => {}}
                    tabIndex={-1}
                    style={{
                        position: 'absolute',
                        opacity: 0,
                        width: 0,
                        height: 0,
                        pointerEvents: 'none'
                    }}
                />
            )}

            {/* Trigger button */}
            <div
                ref={triggerRef}
                className={className}
                style={{
                    ...style,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    userSelect: 'none' as const,
                    minHeight: '40px',
                }}
                onClick={handleOpen}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                onFocus={onFocusCb}
                onBlur={(e) => {
                    // Don't fire blur if focus moves within the container or portal dropdown
                    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
                    if (dropdownRef.current?.contains(e.relatedTarget as Node)) return;
                    onBlurCb?.(e);
                }}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
                <span
                    className="flex-1 truncate text-left"
                    style={{
                        color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '14px',
                    }}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-0.5 rounded transition-colors"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                            title="Hapus pilihan"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <ChevronDown
                        className="w-3.5 h-3.5 transition-transform"
                        style={{
                            color: 'var(--text-muted)',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                        }}
                    />
                </div>
            </div>

            {/* Portal-rendered dropdown */}
            {dropdownContent}
        </div>
    );
}
