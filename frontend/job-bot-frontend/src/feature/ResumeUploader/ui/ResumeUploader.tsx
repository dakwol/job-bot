import React, { useState, useCallback } from "react";
import styles from './styles.module.scss';

interface ResumeUploaderProps {
	onFileSelect: (file: File) => void;
	disabled?: boolean;
}

export function ResumeUploader({ onFileSelect, disabled }: ResumeUploaderProps) {
	const [dragActive, setDragActive] = useState(false);
	const [fileName, setFileName] = useState<string | null>(null);

	const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (!disabled) setDragActive(true);
	}, [disabled]);

	const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragActive(false);
	}, []);

	const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragActive(false);
		if (disabled) return;

		const droppedFiles = e.dataTransfer.files;
		if (droppedFiles.length > 0) {
			const file = droppedFiles[0];
			setFileName(file.name);
			onFileSelect(file);
		}
	}, [onFileSelect, disabled]);

	const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		if (disabled) return;
		if (e.target.files && e.target.files.length > 0) {
			const file = e.target.files[0];
			setFileName(file.name);
			onFileSelect(file);
		}
	}, [onFileSelect, disabled]);

	return (
		<div
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			className={styles.uploaderContainer}
		>
			<input
				type="file"
				onChange={handleInputChange}
				style={{ display: "none" }}
				id="resume-upload"
				disabled={disabled}
				accept=".pdf,.doc,.docx,.txt"
			/>
			<label
				htmlFor="resume-upload"
				style={{ display: "block", cursor: disabled ? "not-allowed" : "pointer" }}
				className={styles.uploadLabel}
			>
				{fileName ? (
					<>
						<p className={styles.uploadLabelText}>📄 {fileName}</p>
						<br />
						<p className={styles.uploadLabelText}>(Кликни или перетащи файл сюда, чтобы заменить)</p>
					</>
				) : (
					<>
						<p className={styles.uploadLabelText}>📁 Перетащи сюда резюме или кликни, чтобы выбрать файл</p>
						<br />
						<p className={styles.uploadLabelText}>Поддерживаются форматы: PDF, DOC, DOCX, TXT</p>
					</>
				)}
			</label>
		</div>
	);
}
