package com.example.whatsapp.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "template_button_rule",
        uniqueConstraints = @UniqueConstraint(columnNames = {"source_template_id", "button_index"}))
@Getter
@Setter
public class TemplateButtonRule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_template_id")
    private TemplateEntity sourceTemplate;

    @Column(nullable = false)
    private int buttonIndex;          // 0, 1, 2 = first, second, third button

    private String buttonText;        // for display/debug

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_template_id")
    private TemplateEntity targetTemplate;   // the template to send next
}